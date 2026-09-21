export type ApplicationStatus = 'pending' | 'no_response' | 'processing' | 'approved' | 'rejected'

export interface Application {
  id: string
  companyName: string
  companyEmail: string | null
  position: string
  /** Stored status. Effective status is computed with getEffectiveStatus(). */
  status: ApplicationStatus
  /** Local calendar date the application was submitted, YYYY-MM-DD. */
  dateApplied: string
  /** Local ISO datetime of last status change. Drives the 7-day No Response rule. */
  lastUpdated: string
  jobSource: string | null
  jobUrl: string | null
  location: string | null
  salary: string | null
  contactPerson: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface ApplicationInput {
  companyName: string
  companyEmail?: string | null
  position: string
  dateApplied: string
  jobSource?: string | null
  jobUrl?: string | null
  location?: string | null
  salary?: string | null
  contactPerson?: string | null
  notes?: string | null
}

export type ApplicationPatch = Partial<ApplicationInput>

export interface StatusHistoryEntry {
  id: string
  applicationId: string
  oldStatus: ApplicationStatus | null
  newStatus: ApplicationStatus
  note: string | null
  changedAt: string
}

export type ThemePreference = 'system' | 'light' | 'dark'

export interface UserSettings {
  onboarded: boolean
  name: string
  theme: ThemePreference
  dailyGoal: number
  weeklyGoal: number
  startOnLaunch: boolean
  notifyDailyGoal: boolean
  notifyWeeklyGoal: boolean
  notifyNoResponse: boolean
  /** YYYY-MM-DD of the last daily goal reminder shown (prevents spam). */
  lastDailyReminderDate: string | null
  /** YYYY-MM-DD of the last weekly goal reminder shown. */
  lastWeeklyReminderDate: string | null
  /** YYYY-MM-DD of the last no-response notification shown. */
  lastNoResponseNotifyDate: string | null
}

export interface StatusCounts {
  total: number
  pending: number
  noResponse: number
  processing: number
  approved: number
  rejected: number
}

export interface BackupFile {
  format: 'trabahotracker-backup'
  version: number
  exportedAt: string
  appVersion: string
  data: {
    applications: Application[]
    statusHistory: StatusHistoryEntry[]
    settings: UserSettings
  }
}

export interface ImportResult {
  canceled: boolean
  importedApplications?: number
  importedHistory?: number
  error?: string
}

export interface ExportResult {
  canceled: boolean
  filePath?: string
  error?: string
}