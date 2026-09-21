import { randomUUID } from 'node:crypto'
import { nowIso } from '@shared/dates.ts'
import type {
  Application,
  ApplicationInput,
  ApplicationPatch,
  ApplicationStatus,
  StatusHistoryEntry
} from '@shared/types.ts'
import { all, get, run, saveNow, transaction } from '../database/db.ts'

const APP_FIELDS = [
  'id',
  'companyName',
  'companyEmail',
  'position',
  'status',
  'dateApplied',
  'lastUpdated',
  'jobSource',
  'jobUrl',
  'location',
  'salary',
  'contactPerson',
  'notes',
  'createdAt',
  'updatedAt'
] as const

function rowToApplication(row: Record<string, unknown>): Application {
  return {
    id: String(row.id),
    companyName: String(row.companyName),
    companyEmail: nullableString(row.companyEmail),
    position: String(row.position),
    status: row.status as ApplicationStatus,
    dateApplied: String(row.dateApplied),
    lastUpdated: String(row.lastUpdated),
    jobSource: nullableString(row.jobSource),
    jobUrl: nullableString(row.jobUrl),
    location: nullableString(row.location),
    salary: nullableString(row.salary),
    contactPerson: nullableString(row.contactPerson),
    notes: nullableString(row.notes),
    createdAt: String(row.createdAt),
    updatedAt: String(row.updatedAt)
  }
}

function nullableString(v: unknown): string | null {
  return v === null || v === undefined || v === '' ? null : String(v)
}

export function listApplications(): Application[] {
  const rows = all<Record<string, unknown>>(
    `SELECT ${APP_FIELDS.join(', ')} FROM applications ORDER BY dateApplied DESC, createdAt DESC`
  )
  return rows.map(rowToApplication)
}

export function getApplication(id: string): Application | null {
  const row = get<Record<string, unknown>>(
    `SELECT ${APP_FIELDS.join(', ')} FROM applications WHERE id = ?`,
    [id]
  )
  return row ? rowToApplication(row) : null
}

function validateInput(input: ApplicationInput): void {
  if (!input.companyName || !input.companyName.trim()) {
    throw new Error('Company name is required.')
  }
  const email = input.companyEmail?.trim()
  if (email && !/^\S+@\S+\.\S+$/.test(email)) {
    throw new Error('Please enter a valid email address.')
  }
  if (!input.position || !input.position.trim()) {
    throw new Error('Position is required.')
  }
  if (!input.dateApplied || !/^\d{4}-\d{2}-\d{2}$/.test(input.dateApplied)) {
    throw new Error('Date applied is required and must be a valid date.')
  }
}

export function createApplication(input: ApplicationInput): Application {
  validateInput(input)
  const now = nowIso()
  const id = randomUUID()
  const app: Application = {
    id,
    companyName: input.companyName.trim(),
    companyEmail: input.companyEmail?.trim() || null,
    position: input.position.trim(),
    status: 'pending',
    dateApplied: input.dateApplied,
    lastUpdated: now,
    jobSource: input.jobSource?.trim() || null,
    jobUrl: input.jobUrl?.trim() || null,
    location: input.location?.trim() || null,
    salary: input.salary?.trim() || null,
    contactPerson: input.contactPerson?.trim() || null,
    notes: input.notes?.trim() || null,
    createdAt: now,
    updatedAt: now
  }

  transaction(() => {
    run(
      `INSERT INTO applications (${APP_FIELDS.join(', ')})
       VALUES (${APP_FIELDS.map(() => '?').join(', ')})`,
      [
        app.id,
        app.companyName,
        app.companyEmail,
        app.position,
        app.status,
        app.dateApplied,
        app.lastUpdated,
        app.jobSource,
        app.jobUrl,
        app.location,
        app.salary,
        app.contactPerson,
        app.notes,
        app.createdAt,
        app.updatedAt
      ]
    )
    insertHistory({
      id: randomUUID(),
      applicationId: app.id,
      oldStatus: null,
      newStatus: 'pending',
      note: 'Application submitted',
      changedAt: now
    })
  })
  saveNow()
  return app
}

export function updateApplication(id: string, patch: ApplicationPatch): Application {
  const existing = getApplication(id)
  if (!existing) throw new Error('Application not found.')

  const next: ApplicationInput = {
    companyName: patch.companyName ?? existing.companyName,
    companyEmail:
      patch.companyEmail !== undefined ? patch.companyEmail : existing.companyEmail,
    position: patch.position ?? existing.position,
    dateApplied: patch.dateApplied ?? existing.dateApplied,
    jobSource: patch.jobSource !== undefined ? patch.jobSource : existing.jobSource,
    jobUrl: patch.jobUrl !== undefined ? patch.jobUrl : existing.jobUrl,
    location: patch.location !== undefined ? patch.location : existing.location,
    salary: patch.salary !== undefined ? patch.salary : existing.salary,
    contactPerson:
      patch.contactPerson !== undefined ? patch.contactPerson : existing.contactPerson,
    notes: patch.notes !== undefined ? patch.notes : existing.notes
  }
  validateInput(next)

  const updatedAt = nowIso()
  run(
    `UPDATE applications SET
       companyName = ?, companyEmail = ?, position = ?, dateApplied = ?,
       jobSource = ?, jobUrl = ?, location = ?, salary = ?, contactPerson = ?, notes = ?,
       updatedAt = ?
     WHERE id = ?`,
    [
      next.companyName!.trim(),
      next.companyEmail?.trim() || null,
      next.position!.trim(),
      next.dateApplied!,
      next.jobSource?.trim() || null,
      next.jobUrl?.trim() || null,
      next.location?.trim() || null,
      next.salary?.trim() || null,
      next.contactPerson?.trim() || null,
      next.notes?.trim() || null,
      updatedAt,
      id
    ]
  )
  saveNow()
  return getApplication(id)!
}

export function deleteApplication(id: string): void {
  const existing = getApplication(id)
  if (!existing) throw new Error('Application not found.')
  transaction(() => {
    run('DELETE FROM application_status_history WHERE applicationId = ?', [id])
    run('DELETE FROM applications WHERE id = ?', [id])
  })
  saveNow()
}

export function changeStatus(
  id: string,
  newStatus: ApplicationStatus,
  note?: string | null
): Application {
  const existing = getApplication(id)
  if (!existing) throw new Error('Application not found.')
  if (!isStatus(newStatus)) throw new Error('Invalid status.')

  if (existing.status === newStatus) {
    return existing
  }

  const changedAt = nowIso()
  transaction(() => {
    run('UPDATE applications SET status = ?, lastUpdated = ?, updatedAt = ? WHERE id = ?', [
      newStatus,
      changedAt,
      changedAt,
      id
    ])
    insertHistory({
      id: randomUUID(),
      applicationId: id,
      oldStatus: existing.status,
      newStatus,
      note: note?.trim() || null,
      changedAt
    })
  })
  saveNow()
  return getApplication(id)!
}

function insertHistory(entry: StatusHistoryEntry): void {
  run(
    `INSERT INTO application_status_history (id, applicationId, oldStatus, newStatus, note, changedAt)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [entry.id, entry.applicationId, entry.oldStatus, entry.newStatus, entry.note, entry.changedAt]
  )
}

export function getStatusHistory(applicationId: string): StatusHistoryEntry[] {
  const rows = all<Record<string, unknown>>(
    `SELECT id, applicationId, oldStatus, newStatus, note, changedAt
     FROM application_status_history
     WHERE applicationId = ?
     ORDER BY changedAt ASC`,
    [applicationId]
  )
  return rows.map((r) => ({
    id: String(r.id),
    applicationId: String(r.applicationId),
    oldStatus: (r.oldStatus as ApplicationStatus) ?? null,
    newStatus: r.newStatus as ApplicationStatus,
    note: nullableString(r.note),
    changedAt: String(r.changedAt)
  }))
}

/** Insert history rows directly (used by backup restore and seed data). */
export function insertHistoryRows(entries: StatusHistoryEntry[]): void {
  transaction(() => {
    for (const entry of entries) {
      insertHistory(entry)
    }
  })
  saveNow()
}

export function getEveryStatusHistory(): StatusHistoryEntry[] {
  const rows = all<Record<string, unknown>>(
    `SELECT id, applicationId, oldStatus, newStatus, note, changedAt
     FROM application_status_history
     ORDER BY changedAt ASC`
  )
  return rows.map((r) => ({
    id: String(r.id),
    applicationId: String(r.applicationId),
    oldStatus: (r.oldStatus as ApplicationStatus) ?? null,
    newStatus: r.newStatus as ApplicationStatus,
    note: nullableString(r.note),
    changedAt: String(r.changedAt)
  }))
}

function isStatus(value: string): value is ApplicationStatus {
  return ['pending', 'no_response', 'processing', 'approved', 'rejected'].includes(value)
}

/** Insert application rows directly (used by backup restore and seed data). */
export function insertApplicationRows(apps: Application[]): void {
  for (const app of apps) {
    if (!getApplication(app.id)) {
      run(
        `INSERT INTO applications (${APP_FIELDS.join(', ')})
         VALUES (${APP_FIELDS.map(() => '?').join(', ')})`,
        [
          app.id,
          app.companyName,
          app.companyEmail,
          app.position,
          app.status,
          app.dateApplied,
          app.lastUpdated,
          app.jobSource,
          app.jobUrl,
          app.location,
          app.salary,
          app.contactPerson,
          app.notes,
          app.createdAt,
          app.updatedAt
        ]
      )
    }
  }
}

export function replaceAllApplications(apps: Application[]): void {
  transaction(() => {
    all<Record<string, unknown>>('SELECT id FROM applications').forEach((r) =>
      run('DELETE FROM application_status_history WHERE applicationId = ?', [String(r.id)])
    )
    run('DELETE FROM applications')
    for (const app of apps) {
      const row: (string | null)[] = [
        app.id,
        app.companyName,
        app.companyEmail,
        app.position,
        app.status,
        app.dateApplied,
        app.lastUpdated,
        app.jobSource,
        app.jobUrl,
        app.location,
        app.salary,
        app.contactPerson,
        app.notes,
        app.createdAt,
        app.updatedAt
      ]
      run(
        `INSERT INTO applications (${APP_FIELDS.join(', ')})
         VALUES (${APP_FIELDS.map(() => '?').join(', ')})`,
        row
      )
    }
  })
  saveNow()
}

export function replaceAllHistory(entries: StatusHistoryEntry[]): void {
  transaction(() => {
    run('DELETE FROM application_status_history')
    for (const entry of entries) {
      insertHistory(entry)
    }
  })
  saveNow()
}

export function clearAllApplications(): void {
  transaction(() => {
    run('DELETE FROM application_status_history')
    run('DELETE FROM applications')
  })
  saveNow()
}