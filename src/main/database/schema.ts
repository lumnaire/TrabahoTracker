import type { SqlJsDatabase } from './db.ts'

interface Migration {
  version: number
  name: string
  up: (db: SqlJsDatabase) => void
}

const MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: 'initial-schema',
    up: (db) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS applications (
          id            TEXT PRIMARY KEY,
          companyName   TEXT NOT NULL,
          companyEmail  TEXT NOT NULL,
          position      TEXT NOT NULL,
          status        TEXT NOT NULL DEFAULT 'pending',
          dateApplied   TEXT NOT NULL,
          lastUpdated   TEXT NOT NULL,
          jobSource     TEXT,
          jobUrl        TEXT,
          location      TEXT,
          salary        TEXT,
          contactPerson TEXT,
          notes         TEXT,
          createdAt     TEXT NOT NULL,
          updatedAt     TEXT NOT NULL
        )
      `)
      db.run(
        'CREATE INDEX IF NOT EXISTS idx_applications_dateApplied ON applications(dateApplied)'
      )
      db.run('CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status)')
      db.run(`
        CREATE TABLE IF NOT EXISTS application_status_history (
          id            TEXT PRIMARY KEY,
          applicationId TEXT NOT NULL,
          oldStatus     TEXT,
          newStatus     TEXT NOT NULL,
          note          TEXT,
          changedAt     TEXT NOT NULL,
          FOREIGN KEY (applicationId) REFERENCES applications(id) ON DELETE CASCADE
        )
      `)
      db.run(
        'CREATE INDEX IF NOT EXISTS idx_history_applicationId ON application_status_history(applicationId)'
      )
      db.run(`
        CREATE TABLE IF NOT EXISTS settings (
          key   TEXT PRIMARY KEY,
          value TEXT NOT NULL
        )
      `)
    }
  },
  {
    version: 2,
    name: 'nullable-company-email',
    up: (db) => {
      // companyEmail is now optional. Rebuild the table inside the same
      // transaction (SQLite DROP TABLE ignores FK constraints, and the
      // history table's FK resolves by table name at runtime).
      db.run(`
        CREATE TABLE applications_new (
          id            TEXT PRIMARY KEY,
          companyName   TEXT NOT NULL,
          companyEmail  TEXT,
          position      TEXT NOT NULL,
          status        TEXT NOT NULL DEFAULT 'pending',
          dateApplied   TEXT NOT NULL,
          lastUpdated   TEXT NOT NULL,
          jobSource     TEXT,
          jobUrl        TEXT,
          location      TEXT,
          salary        TEXT,
          contactPerson TEXT,
          notes         TEXT,
          createdAt     TEXT NOT NULL,
          updatedAt     TEXT NOT NULL
        )
      `)
      db.run(`
        INSERT INTO applications_new (
          id, companyName, companyEmail, position, status, dateApplied, lastUpdated,
          jobSource, jobUrl, location, salary, contactPerson, notes, createdAt, updatedAt
        )
        SELECT
          id, companyName, companyEmail, position, status, dateApplied, lastUpdated,
          jobSource, jobUrl, location, salary, contactPerson, notes, createdAt, updatedAt
        FROM applications
      `)
      db.run('DROP TABLE applications')
      db.run('ALTER TABLE applications_new RENAME TO applications')
      db.run('CREATE INDEX IF NOT EXISTS idx_applications_dateApplied ON applications(dateApplied)')
      db.run('CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status)')
    }
  }
]

export function runMigrations(db: SqlJsDatabase): void {
  const result = db.exec('PRAGMA user_version')
  const current = (result[0]?.values?.[0]?.[0] as number) ?? 0
  const pending = MIGRATIONS.filter((m) => m.version > current)
  for (const migration of pending) {
    db.run('BEGIN')
    try {
      migration.up(db)
      db.run(`PRAGMA user_version = ${migration.version}`)
      db.run('COMMIT')
    } catch (err) {
      db.run('ROLLBACK')
      throw err
    }
  }
}