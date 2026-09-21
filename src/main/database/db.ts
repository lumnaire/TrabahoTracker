import { resolve, join } from 'node:path'
import { app } from 'electron'
import { createRequire } from 'node:module'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import type { QueryExecResult } from 'sql.js'
import { DB_FILENAME } from '@shared/constants.ts'
import { runMigrations } from './schema.ts'

const require = createRequire(import.meta.url)

// sql.js is loaded via dynamic helper so the bundler never tries to inline the
// wasm file — at runtime we hand the wasm binary to the initializer directly.
type SqlJsFactory = (config?: {
  wasmBinary?: Uint8Array
}) => Promise<SqlJsDatabaseModule>

interface SqlJsDatabaseModule {
  Database: new (data?: Uint8Array) => SqlJsDatabase
}

export interface SqlJsDatabase {
  run(sql: string, params?: unknown[]): void
  exec(sql: string): QueryExecResult[]
  getRowsModified(): number
  prepare(sql: string, params?: unknown[]): SqlJsStatement
  export(): Uint8Array
  close(): void
}

export interface SqlJsStatement {
  bind(params?: unknown[]): boolean
  step(): boolean
  getAsObject(): Record<string, unknown>
  columns(): ColumnInfo[]
  free(): boolean
  reset(): void
  getSQL(): string
}

export interface ColumnInfo {
  name: string
}

let instance: SqlJsDatabase | null = null
let dbPath = ''
let saveQueued = false
let saveTimer: ReturnType<typeof setTimeout> | null = null

/** Run an SQL statement prepared with bound positional params (?). */
export function run(sql: string, params: unknown[] = []): void {
  db().run(sql, params)
}

/** Fetch all rows for a query as plain objects. */
export function all<T extends Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): T[] {
  const stmt = db().prepare(sql)
  try {
    stmt.bind(params)
    const rows: T[] = []
    while (stmt.step()) {
      rows.push(stmt.getAsObject() as T)
    }
    return rows
  } finally {
    stmt.free()
  }
}

/** Fetch a single row or null. */
export function get<T extends Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): T | null {
  const rows = all<T>(sql, params)
  return rows[0] ?? null
}

export function db(): SqlJsDatabase {
  if (!instance) throw new Error('Database is not initialized')
  return instance
}

/** Apply a batch of statements atomically. */
export function transaction(fn: () => void): void {
  const d = db()
  d.run('BEGIN')
  try {
    fn()
    d.run('COMMIT')
  } catch (err) {
    d.run('ROLLBACK')
    throw err
  }
}

export async function initDb(): Promise<void> {
  dbPath = join(app.getPath('userData'), DB_FILENAME)
  mkdirSync(app.getPath('userData'), { recursive: true })

  const sqlJs: SqlJsFactory = require('sql.js')
  const wasmPath = ensureWasmPath()
  const wasmBinary = readFileSync(wasmPath)
  const SQL = await sqlJs({ wasmBinary })

  if (existsSync(dbPath)) {
    const bytes = readFileSync(dbPath)
    instance = new SQL.Database(bytes)
  } else {
    instance = new SQL.Database()
    saveNow()
  }

  instance.run('PRAGMA foreign_keys = ON')
  runMigrations(instance)
}

function ensureWasmPath(): string {
  try {
    return require.resolve('sql.js/dist/sql-wasm.wasm')
  } catch {
    // Fallback: look inside the package directory.
    return resolve('node_modules', 'sql.js', 'dist', 'sql-wasm.wasm')
  }
}

/** Write the in-memory DB to disk immediately (durable after each mutation). */
export function saveNow(): void {
  if (instance && dbPath) {
    const bytes = instance.export()
    writeFileSync(dbPath, Buffer.from(bytes))
  }
}

/** Debounced save; safe to call after every mutation. */
export function save(): void {
  if (saveQueued) return
  saveQueued = true
  saveTimer = setTimeout(() => {
    saveQueued = false
    saveTimer = null
    saveNow()
  }, 250)
}

export function closeDb(): void {
  if (saveTimer) {
    clearTimeout(saveTimer)
    saveTimer = null
  }
  if (instance) {
    saveNow()
    instance.close()
    instance = null
  }
}