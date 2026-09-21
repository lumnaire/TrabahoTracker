import {
  DEFAULT_DAILY_GOAL,
  DEFAULT_WEEKLY_GOAL,
  WEEKDAY_LABELS
} from './constants.ts'
import {
  addDays,
  currentWeekKey,
  diffDateKeys,
  eachDayBetween,
  formatWeekRangeKey,
  fromDateKey,
  inWeek,
  isWeekday,
  monthKey,
  recentWeekKeys,
  todayKey
} from './dates.ts'
import { statusCounts } from './status.ts'
import type { Application, StatusCounts } from './types.ts'

export interface WeekdayProgressDay {
  dayIndex: number // 1..5
  label: string
  dateKey: string
  count: number
  goal: number
  complete: boolean
}

export interface DailyGoalProgress {
  todayOk: boolean
  weekdays: WeekdayProgressDay[]
}

export interface WeeklyProgress {
  weekKey: string
  mondayLabel: string
  applied: number
  goal: number
  percent: number
  remaining: number
  complete: boolean
}

export interface StreakStats {
  current: number
  longest: number
}

/** Applications grouped by their dateApplied key. */
export function countByDate(applications: readonly Application[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const app of applications) {
    map.set(app.dateApplied, (map.get(app.dateApplied) ?? 0) + 1)
  }
  return map
}

function weekdayFrame(now: Date): { monday: Date; keys: string[] } {
  const monday = fromDateKey(currentWeekKey(now))
  const keys = WEEKDAY_LABELS.map((_, i) => addDays(currentWeekKey(now), i))
  return { monday, keys }
}

export function computeDailyGoal(
  applications: readonly Application[],
  dailyGoal: number,
  now: Date = new Date()
): DailyGoalProgress {
  const byDate = countByDate(applications)
  const { keys } = weekdayFrame(now)
  const today = todayKey(now)
  const weekdays = WEEKDAY_LABELS.map((label, i) => {
    const dateKey = keys[i]
    const count = byDate.get(dateKey) ?? 0
    return {
      dayIndex: i + 1,
      label,
      dateKey,
      count,
      goal: dailyGoal,
      complete: count >= dailyGoal
    }
  })
  const todayCount = byDate.get(today) ?? 0
  return { todayOk: todayCount >= dailyGoal, weekdays }
}

export function computeWeekly(
  applications: readonly Application[],
  weeklyGoal: number,
  now: Date = new Date()
): WeeklyProgress {
  const week = currentWeekKey(now)
  const mondayLabel = formatWeekRangeKey(week)
  const applied = applications.filter((a) => inWeek(a.dateApplied, week)).length
  const complete = applied >= weeklyGoal
  return {
    weekKey: week,
    mondayLabel,
    applied,
    goal: weeklyGoal,
    percent: weeklyGoal > 0 ? Math.min(100, Math.round((applied / weeklyGoal) * 100)) : 0,
    remaining: Math.max(0, weeklyGoal - applied),
    complete
  }
}

function wasDayComplete(counts: Map<string, number>, dateKey: string, goal: number): boolean {
  return (counts.get(dateKey) ?? 0) >= goal
}

/**
 * Weekday consistency streak. Weekends neither count nor break the streak.
 * If today is a weekday and not yet complete, the streak is still alive up to
 * the most recent completed weekday (Duolingo-style).
 */
export function computeStreaks(
  applications: readonly Application[],
  dailyGoal: number,
  now: Date = new Date()
): StreakStats {
  const byDate = countByDate(applications)
  const today = todayKey(now)

  // Current streak
  let cursor = today
  if (isWeekday(cursor) && !wasDayComplete(byDate, cursor, dailyGoal)) {
    cursor = addDays(cursor, -1)
  }
  while (!isWeekday(cursor)) {
    cursor = addDays(cursor, -1)
  }
  let current = 0
  while (isWeekday(cursor) && wasDayComplete(byDate, cursor, dailyGoal)) {
    current++
    cursor = addDays(cursor, -1)
    while (!isWeekday(cursor)) {
      cursor = addDays(cursor, -1)
    }
  }

  // Longest streak: scan every day from first application date to today.
  let longest = 0
  if (byDate.size > 0) {
    let firstKey = addDays(today, -1000)
    for (const k of byDate.keys()) {
      if (k < firstKey) firstKey = k
    }
    const endKey = addDays(today, 1)
    let run = 0
    for (let d = firstKey; d < endKey; d = addDays(d, 1)) {
      if (isWeekday(d)) {
        if (wasDayComplete(byDate, d, dailyGoal)) {
          run++
          if (run > longest) longest = run
        } else {
          run = 0
        }
      }
    }
  }

  return { current, longest }
}

export interface WeeklyHistoryRow {
  weekKey: string
  mondayLabel: string
  applied: number
  goal: number
  percent: number
  complete: boolean
}

export function computeWeeklyHistory(
  applications: readonly Application[],
  weeklyGoal: number,
  now: Date = new Date(),
  weeks = 12
): WeeklyHistoryRow[] {
  return recentWeekKeys(now, weeks).map((w) => {
    const applied = applications.filter((a) => inWeek(a.dateApplied, w)).length
    return {
      weekKey: w,
      mondayLabel: formatWeekRangeKey(w),
      applied,
      goal: weeklyGoal,
      percent: weeklyGoal > 0 ? Math.round((applied / weeklyGoal) * 100) : 0,
      complete: applied >= weeklyGoal
    }
  })
}

export interface VolumeStats {
  today: number
  thisWeek: number
  thisMonth: number
  allTime: number
}

export function computeVolume(
  applications: readonly Application[],
  now: Date = new Date()
): VolumeStats {
  const today = todayKey(now)
  const week = currentWeekKey(now)
  const month = monthKey(today)
  let thisWeek = 0
  let thisMonth = 0
  for (const app of applications) {
    if (inWeek(app.dateApplied, week)) thisWeek++
    if (monthKey(app.dateApplied) === month) thisMonth++
  }
  const todayCount = applications.filter((a) => a.dateApplied === today).length
  return {
    today: todayCount,
    thisWeek,
    thisMonth,
    allTime: applications.length
  }
}

export interface DailySeriesPoint {
  dateKey: string
  label: string
  count: number
}

export function computeDailySeries(
  applications: readonly Application[],
  now: Date = new Date(),
  days = 30
): DailySeriesPoint[] {
  const byDate = countByDate(applications)
  const end = todayKey(now)
  const start = addDays(end, -(days - 1))
  return eachDayBetween(start, end).map((d) => ({
    dateKey: d,
    label: d.slice(5),
    count: byDate.get(d) ?? 0
  }))
}

export interface MonthlyPoint {
  monthKey: string
  label: string
  count: number
}

export function computeMonthlySeries(
  applications: readonly Application[],
  now: Date = new Date(),
  months = 6
): MonthlyPoint[] {
  const byMonth = new Map<string, number>()
  for (const app of applications) {
    const m = monthKey(app.dateApplied)
    byMonth.set(m, (byMonth.get(m) ?? 0) + 1)
  }
  const points: MonthlyPoint[] = []
  const cur = new Date(now.getFullYear(), now.getMonth(), 1)
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(cur.getFullYear(), cur.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    points.push({
      monthKey: key,
      label: d.toLocaleDateString('en-PH', { month: 'short' }),
      count: byMonth.get(key) ?? 0
    })
  }
  return points
}

export interface ResponseMetrics {
  responseRate: number
  noResponseRate: number
  rejectionRate: number
  processingRate: number
  approvalRate: number
}

/**
 * Response rate = (Processing + Approved + Rejected) / Total.
 * No Response is NOT a rejection.
 */
export function computeResponseMetrics(counts: StatusCounts): ResponseMetrics {
  const total = counts.total
  const responded = counts.processing + counts.approved + counts.rejected
  const pct = (n: number): number => (total > 0 ? (n / total) * 100 : 0)
  return {
    responseRate: pct(responded),
    noResponseRate: pct(counts.noResponse),
    rejectionRate: pct(counts.rejected),
    processingRate: pct(counts.processing),
    approvalRate: pct(counts.approved)
  }
}

export interface ConsistencyStats {
  currentStreak: number
  longestStreak: number
  averagePerDay: number
  averagePerWeek: number
  daysTracked: number
  weeksTracked: number
}

export function computeConsistency(
  applications: readonly Application[],
  dailyGoal: number,
  now: Date = new Date()
): ConsistencyStats {
  const streaks = computeStreaks(applications, dailyGoal, now)
  const today = todayKey(now)
  let firstKey: string | null = null
  for (const app of applications) {
    if (firstKey === null || app.dateApplied < firstKey) firstKey = app.dateApplied
  }
  if (firstKey === null || applications.length === 0) {
    return { currentStreak: 0, longestStreak: 0, averagePerDay: 0, averagePerWeek: 0, daysTracked: 0, weeksTracked: 0 }
  }
  if (firstKey > today) firstKey = today
  const daysTracked = diffDateKeys(today, firstKey) + 1
  const weeksTracked = Math.max(1, Math.ceil(daysTracked / 7))
  return {
    currentStreak: streaks.current,
    longestStreak: streaks.longest,
    averagePerDay: round1(applications.length / daysTracked),
    averagePerWeek: round1(applications.length / weeksTracked),
    daysTracked,
    weeksTracked
  }
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

export function summaryStats(
  applications: readonly Application[],
  dailyGoal: number = DEFAULT_DAILY_GOAL,
  weeklyGoal: number = DEFAULT_WEEKLY_GOAL,
  now: Date = new Date()
): {
  counts: StatusCounts
  daily: DailyGoalProgress
  weekly: WeeklyProgress
  streaks: StreakStats
} {
  return {
    counts: statusCounts(applications, now),
    daily: computeDailyGoal(applications, dailyGoal, now),
    weekly: computeWeekly(applications, weeklyGoal, now),
    streaks: computeStreaks(applications, dailyGoal, now)
  }
}