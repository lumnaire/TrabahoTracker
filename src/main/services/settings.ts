import { DEFAULT_DAILY_GOAL, DEFAULT_WEEKLY_GOAL } from '@shared/constants.ts'
import type { ThemePreference, UserSettings } from '@shared/types.ts'
import { get, run, saveNow } from '../database/db.ts'

const SETTINGS_KEY = 'main'

export const DEFAULT_SETTINGS: UserSettings = {
  onboarded: false,
  name: '',
  theme: 'system',
  dailyGoal: DEFAULT_DAILY_GOAL,
  weeklyGoal: DEFAULT_WEEKLY_GOAL,
  startOnLaunch: false,
  notifyDailyGoal: true,
  notifyWeeklyGoal: true,
  notifyNoResponse: true,
  lastDailyReminderDate: null,
  lastWeeklyReminderDate: null,
  lastNoResponseNotifyDate: null
}

export function getSettings(): UserSettings {
  const row = get<{ value: string }>('SELECT value FROM settings WHERE key = ?', [SETTINGS_KEY])
  if (!row) return { ...DEFAULT_SETTINGS }
  try {
    const stored = JSON.parse(row.value) as Partial<UserSettings>
    return { ...DEFAULT_SETTINGS, ...stored }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function updateSettings(patch: Partial<UserSettings>): UserSettings {
  const next = { ...getSettings(), ...patch }
  run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [
    SETTINGS_KEY,
    JSON.stringify(next)
  ])
  saveNow()
  return next
}

function isTheme(value: unknown): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark'
}

export function validateSettingsPatch(patch: Partial<UserSettings>): Partial<UserSettings> {
  const clean: Partial<UserSettings> = {}
  if (typeof patch.onboarded === 'boolean') clean.onboarded = patch.onboarded
  if (typeof patch.name === 'string') clean.name = patch.name.trim()
  if (isTheme(patch.theme)) clean.theme = patch.theme
  if (typeof patch.dailyGoal === 'number' && Number.isFinite(patch.dailyGoal)) {
    clean.dailyGoal = Math.max(1, Math.floor(patch.dailyGoal))
  }
  if (typeof patch.weeklyGoal === 'number' && Number.isFinite(patch.weeklyGoal)) {
    clean.weeklyGoal = Math.max(1, Math.floor(patch.weeklyGoal))
  }
  if (typeof patch.startOnLaunch === 'boolean') clean.startOnLaunch = patch.startOnLaunch
  if (typeof patch.notifyDailyGoal === 'boolean') clean.notifyDailyGoal = patch.notifyDailyGoal
  if (typeof patch.notifyWeeklyGoal === 'boolean') clean.notifyWeeklyGoal = patch.notifyWeeklyGoal
  if (typeof patch.notifyNoResponse === 'boolean') clean.notifyNoResponse = patch.notifyNoResponse
  if (typeof patch.lastDailyReminderDate === 'string' || patch.lastDailyReminderDate === null) {
    clean.lastDailyReminderDate = patch.lastDailyReminderDate
  }
  if (typeof patch.lastWeeklyReminderDate === 'string' || patch.lastWeeklyReminderDate === null) {
    clean.lastWeeklyReminderDate = patch.lastWeeklyReminderDate
  }
  if (typeof patch.lastNoResponseNotifyDate === 'string' || patch.lastNoResponseNotifyDate === null) {
    clean.lastNoResponseNotifyDate = patch.lastNoResponseNotifyDate
  }
  return clean
}