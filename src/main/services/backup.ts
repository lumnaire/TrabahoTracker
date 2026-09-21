import { app, dialog } from 'electron'
import { randomUUID } from 'node:crypto'
import { join } from 'node:path'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { BACKUP_FORMAT, BACKUP_VERSION, DB_FILENAME } from '@shared/constants.ts'
import { nowIso, todayKey } from '@shared/dates.ts'
import type { Application, BackupFile, ExportResult, ImportResult } from '@shared/types.ts'
import {
  getEveryStatusHistory,
  listApplications,
  replaceAllApplications,
  replaceAllHistory
} from './applications.ts'
import { getSettings, updateSettings } from './settings.ts'

const pendingImports = new Map<string, BackupFile>()

function defaultBackupFileName(): string {
  return `trabahotracker-backup-${todayKey()}.json`
}

export async function exportData(): Promise<ExportResult> {
  const result = await dialog.showSaveDialog({
    title: 'Export TrabahoTracker data',
    defaultPath: join(app.getPath('downloads') || app.getPath('home'), defaultBackupFileName()),
    filters: [{ name: 'JSON Backup', extensions: ['json'] }]
  })
  if (result.canceled || !result.filePath) return { canceled: true }

  const backup: BackupFile = {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: nowIso(),
    appVersion: app.getVersion(),
    data: {
      applications: listApplications(),
      statusHistory: getEveryStatusHistory(),
      settings: getSettings()
    }
  }

  try {
    writeFileSync(result.filePath, JSON.stringify(backup, null, 2), 'utf8')
    return { canceled: false, filePath: result.filePath }
  } catch (err) {
    return { canceled: false, error: (err as Error).message }
  }
}

export async function pickImportFile(): Promise<
  | { canceled: true }
  | { canceled: false; token: string; applications: number; history: number; exportedAt: string }
> {
  const result = await dialog.showOpenDialog({
    title: 'Import TrabahoTracker backup',
    properties: ['openFile'],
    filters: [{ name: 'JSON Backup', extensions: ['json'] }]
  })
  if (result.canceled || result.filePaths.length === 0) return { canceled: true }

  const filePath = result.filePaths[0]
  let backup: BackupFile
  try {
    backup = parseBackup(readFileSync(filePath, 'utf8'))
  } catch (err) {
    throw new Error(`Cannot read backup file: ${(err as Error).message}`)
  }

  const token = randomUUID()
  pendingImports.set(token, backup)
  return {
    canceled: false,
    token,
    applications: backup.data.applications.length,
    history: backup.data.statusHistory.length,
    exportedAt: backup.exportedAt
  }
}

export function performImport(token: string): ImportResult {
  const backup = pendingImports.get(token)
  if (!backup) throw new Error('Import session expired. Please choose the file again.')
  pendingImports.delete(token)

  // Safety: keep an automatic backup of the current database before replacing.
  backupCurrentDatabase()

  replaceAllApplications(backup.data.applications)
  replaceAllHistory(backup.data.statusHistory)
  updateSettings(backup.data.settings)

  return {
    canceled: false,
    importedApplications: backup.data.applications.length,
    importedHistory: backup.data.statusHistory.length
  }
}

function backupCurrentDatabase(): void {
  try {
    const backupDir = join(app.getPath('userData'), 'backups')
    mkdirSync(backupDir, { recursive: true })
    const source = join(app.getPath('userData'), DB_FILENAME)
    if (existsSync(source)) {
      writeFileSync(
        join(backupDir, `pre-import-${nowIso().replace(/[:.]/g, '-')}.sqlite`),
        readFileSync(source)
      )
    }
  } catch {
    // Best-effort only; never block an import because of it.
  }
}

export function parseBackup(raw: string): BackupFile {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('Not valid JSON.')
  }
  if (!isBackupFile(parsed)) {
    throw new Error(
      'This file is not a TrabahoTracker backup (unexpected format or version).'
    )
  }
  return parsed
}

function isBackupFile(value: unknown): value is BackupFile {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  const data = v.data as Record<string, unknown> | undefined
  if (v.format !== BACKUP_FORMAT) return false
  if (typeof v.version !== 'number' || v.version > BACKUP_VERSION) return false
  if (!data) return false
  if (!Array.isArray(data.applications)) return false
  if (!Array.isArray(data.statusHistory)) return false
  if (
    !data.applications.every(
      (a) => a && typeof a === 'object' && typeof (a as Application).id === 'string'
    )
  ) {
    return false
  }
  return true
}