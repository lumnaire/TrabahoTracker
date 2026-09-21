const MS_PER_DAY = 24 * 60 * 60 * 1000
const MS_PER_HOUR = 60 * 60 * 1000
const MS_PER_MINUTE = 60 * 1000

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

/** YYYY-MM-DD for the given date, using the machine's local calendar. */
export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

/** Today's local calendar date as YYYY-MM-DD. */
export function todayKey(now: Date = new Date()): string {
  return toDateKey(now)
}

/** Local midnight for a YYYY-MM-DD key. */
export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** YYYY-MM-DD appended with local wall-clock time. Stored/compared as local. */
export function toLocalIso(date: Date): string {
  return (
    toDateKey(date) +
    `T${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}.${String(
      date.getMilliseconds()
    ).padStart(3, '0')}`
  )
}

export function nowIso(now: Date = new Date()): string {
  return toLocalIso(now)
}

/** Parse a local ISO string (no timezone suffix) as the local Date. */
export function parseLocalIso(iso: string): Date {
  return new Date(iso)
}

/** Whole/local calendar date string for an ISO timestamp. */
export function dateKeyOf(iso: string): string {
  return toDateKey(parseLocalIso(iso))
}

/** Whole days elapsed between a local ISO timestamp and now (fractional below 7-day threshold is fine). */
export function daysSince(iso: string, now: Date = new Date()): number {
  return (now.getTime() - parseLocalIso(iso).getTime()) / MS_PER_DAY
}

export function hoursSince(iso: string, now: Date = new Date()): number {
  return (now.getTime() - parseLocalIso(iso).getTime()) / MS_PER_HOUR
}

export function minutesSince(iso: string, now: Date = new Date()): number {
  return (now.getTime() - parseLocalIso(iso).getTime()) / MS_PER_MINUTE
}

/** Add n days to a YYYY-MM-DD key, returning a new key. */
export function addDays(key: string, days: number): string {
  const d = fromDateKey(key)
  d.setDate(d.getDate() + days)
  return toDateKey(d)
}

export function addDaysDate(date: Date, days: number): Date {
  const d = new Date(date.getTime())
  d.setDate(d.getDate() + days)
  return d
}

/** Monday (week start) of the week containing the given date. */
export function startOfWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const dow = d.getDay()
  const diff = dow === 0 ? -6 : 1 - dow
  d.setDate(d.getDate() + diff)
  return d
}

/** Monday of the week for a date key, as YYYY-MM-DD. */
export function weekKey(dateKey: string): string {
  return toDateKey(startOfWeek(fromDateKey(dateKey)))
}

/** Week key of today. */
export function currentWeekKey(now: Date = new Date()): string {
  return weekKey(todayKey(now))
}

/** Friday of the week containing the given date. */
export function endOfWeek(date: Date): Date {
  const monday = startOfWeek(date)
  return addDaysDate(monday, 4)
}

/** 1 = Monday ... 5 = Friday, 0 = Saturday, 6 = Sunday. */
export function weekdayIndex(date: Date | string): number {
  const d = typeof date === 'string' ? fromDateKey(date) : date
  return d.getDay()
}

export function isWeekday(date: Date | string): boolean {
  const d = typeof date === 'string' ? fromDateKey(date) : date
  return d.getDay() >= 1 && d.getDay() <= 5
}

/** YYYY-MM for a date key. */
export function monthKey(dateKey: string): string {
  return dateKey.slice(0, 7)
}

export function currentMonthKey(now: Date = new Date()): string {
  return monthKey(todayKey(now))
}

/** All date keys from startKey to endKey inclusive. */
export function eachDayBetween(startKey: string, endKey: string): string[] {
  const keys: string[] = []
  let cur = startKey
  while (cur <= endKey) {
    keys.push(cur)
    cur = addDays(cur, 1)
  }
  return keys
}

/** "September 21, 2026" using the local calendar. */
export function formatLongDate(keyOrDate: string | Date): string {
  const d = typeof keyOrDate === 'string' ? fromDateKey(keyOrDate) : keyOrDate
  return d.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export function formatMediumDate(keyOrDate: string | Date): string {
  const d = typeof keyOrDate === 'string' ? fromDateKey(keyOrDate) : keyOrDate
  return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
}

export function formatShortMonth(key: string): string {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('en-PH', { month: 'short' })
}

/** "Just now", "5 minutes ago", "2 hours ago", "3 days ago", or a date. */
export function formatRelative(iso: string, now: Date = new Date()): string {
  const mins = minutesSince(iso, now)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${Math.floor(mins)} minute${Math.floor(mins) === 1 ? '' : 's'} ago`
  const hrs = hoursSince(iso, now)
  if (hrs < 24) return `${Math.floor(hrs)} hour${Math.floor(hrs) === 1 ? '' : 's'} ago`
  const days = Math.floor(daysSince(iso, now))
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`
  return formatLongDate(dateKeyOf(iso))
}

/** Difference in whole calendar days between two date keys (a - b). */
export function diffDateKeys(a: string, b: string): number {
  const da = fromDateKey(a).getTime()
  const db = fromDateKey(b).getTime()
  return Math.round((da - db) / MS_PER_DAY)
}

/** All Monday week keys from the current week back `count` weeks. */
export function recentWeekKeys(now: Date = new Date(), count = 12): string[] {
  const keys: string[] = []
  const monday = startOfWeek(now)
  for (let i = 0; i < count; i++) {
    keys.push(toDateKey(monday))
    monday.setDate(monday.getDate() - 7)
  }
  return keys.reverse()
}

/** Is `dateApplied` within the ISO week starting at mondayKey (Monday .. Sunday)? */
export function inWeek(dateApplied: string, mondayKey: string): boolean {
  return dateApplied >= mondayKey && dateApplied <= addDays(mondayKey, 6)
}

export function formatWeekRangeKey(mondayKey: string): string {
  return `${formatMediumDate(mondayKey)} – ${formatMediumDate(addDays(mondayKey, 4))}`
}