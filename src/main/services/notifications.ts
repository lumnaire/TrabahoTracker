import { Notification } from 'electron'
import { todayKey } from '@shared/dates.ts'
import { getEffectiveStatus } from '@shared/status.ts'
import { listApplications } from './applications.ts'
import { getSettings, updateSettings } from './settings.ts'

export function showNotification(title: string, body: string): void {
  if (!Notification.isSupported()) return
  const notification = new Notification({ title, body })
  notification.show()
}

function weeklyCount(apps: ReturnType<typeof listApplications>, now: Date): number {
  const diff = now.getDay() === 0 ? -6 : 1 - now.getDay()
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  monday.setDate(monday.getDate() + diff)
  const mondayKey = todayKey(monday)
  return apps.filter((a) => a.dateApplied >= mondayKey && a.dateApplied <= todayKey(now)).length
}

/**
 * Runs on app launch and on an hourly timer. Fires at most one reminder per
 * category per calendar day so it never spams the user.
 */
export function checkReminders(now: Date = new Date()): void {
  const settings = getSettings()
  const today = todayKey(now)
  const apps = listApplications()

  if (settings.notifyDailyGoal) {
    const weekday = todayKey(now)
    const countOnDay = apps.filter((a) => a.dateApplied === weekday).length
    const remaining = settings.dailyGoal - countOnDay
    const isWorkday = now.getDay() >= 1 && now.getDay() <= 5
    if (
      isWorkday &&
      remaining > 0 &&
      settings.lastDailyReminderDate !== today
    ) {
      updateSettings({ lastDailyReminderDate: today })
      showNotification(
        'Daily goal',
        `${remaining} more application${remaining === 1 ? '' : 's'} to reach today's goal. Keep going!`
      )
    }
  }

  if (settings.notifyWeeklyGoal) {
    const weekCount = weeklyCount(apps, now)
    const remaining = settings.weeklyGoal - weekCount
    if (remaining > 0 && settings.lastWeeklyReminderDate !== today) {
      updateSettings({ lastWeeklyReminderDate: today })
      showNotification(
        'Weekly goal',
        `${remaining} application${remaining === 1 ? '' : 's'} left toward your weekly target of ${settings.weeklyGoal}.`
      )
    }
  }

  if (settings.notifyNoResponse) {
    const stale = apps.filter((a) => getEffectiveStatus(a.status, a.lastUpdated, now) === 'no_response')
    if (stale.length > 0 && settings.lastNoResponseNotifyDate !== today) {
      updateSettings({ lastNoResponseNotifyDate: today })
      const sources = stale.length > 3 ? '' : ` (${stale.map((a) => a.companyName).join(', ')})`
      showNotification(
        'No response',
        `${stale.length} application${stale.length === 1 ? ' has' : 's have'} had no response for 7+ days${sources}.`
      )
    }
  }
}