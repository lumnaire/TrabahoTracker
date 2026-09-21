import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  computeDailyGoal,
  computeStreaks,
  computeVolume,
  computeWeekly,
  computeWeeklyHistory,
  summaryStats
} from '../src/shared/goals.ts'
import type { Application } from '../src/shared/types.ts'

// Fixed "now": Monday 2026-09-21.
const NOW = new Date(2026, 8, 21, 12, 0, 0)
const WORK_WEEK = ['2026-09-21', '2026-09-22', '2026-09-23', '2026-09-24', '2026-09-25']

function app(dateApplied: string, opts: Partial<Application> = {}): Application {
  return {
    id: `id-${dateApplied}-${Math.random()}`,
    companyName: 'Acme',
    companyEmail: 'hr@acme.com',
    position: 'Developer',
    status: 'pending',
    dateApplied,
    lastUpdated: `${dateApplied}T09:00:00.000`,
    jobSource: null,
    jobUrl: null,
    location: null,
    salary: null,
    contactPerson: null,
    notes: null,
    createdAt: `${dateApplied}T09:00:00.000`,
    updatedAt: `${dateApplied}T09:00:00.000`,
    ...opts
  }
}

function nApps(dateApplied: string, count: number): Application[] {
  return Array.from({ length: count }, () => app(dateApplied))
}

test('Test 6: 10 applications on Monday completes Monday', () => {
  const apps = nApps('2026-09-21', 10)
  const daily = computeDailyGoal(apps, 10, NOW)
  assert.equal(daily.weekdays[0].dateKey, '2026-09-21')
  assert.ok(daily.weekdays[0].complete)
  assert.equal(daily.weekdays[0].count, 10)
})

test('Test 7: 9 applications on Tuesday shows 9/10, not complete', () => {
  const apps = nApps('2026-09-22', 9)
  const daily = computeDailyGoal(apps, 10, NOW)
  const tue = daily.weekdays[1]
  assert.equal(tue.dateKey, '2026-09-22')
  assert.equal(tue.count, 9)
  assert.ok(!tue.complete)
})

test('Test 8: 50 applications Mon-Fri completes the weekly goal', () => {
  const apps = [
    ...nApps('2026-09-21', 10),
    ...nApps('2026-09-22', 10),
    ...nApps('2026-09-23', 10),
    ...nApps('2026-09-24', 5),
    ...nApps('2026-09-25', 15)
  ]
  const weekly = computeWeekly(apps, 50, NOW)
  assert.equal(weekly.applied, 50)
  assert.ok(weekly.complete)
  assert.equal(weekly.remaining, 0)
  assert.equal(weekly.percent, 100)

  // Section 32: weekly goal COMPLETE even though Thursday daily goal is NOT.
  const daily = computeDailyGoal(apps, 10, NOW)
  assert.ok(!daily.weekdays[3].complete) // Thursday (5 apps) not complete
  assert.ok(daily.weekdays[4].complete) // Friday (15 apps) complete
  assert.equal(weekly.applied / 5, 10, 'sanity: weekly total is not divided by 5')
  assert.equal(weekly.applied, 50)
})

test('weekly goal is not reached by dividing across days', () => {
  // 6 apps each weekday = 30 total, still below the 50 goal regardless of daily math.
  const apps = WORK_WEEK.flatMap((d) => nApps(d, 6))
  const weekly = computeWeekly(apps, 50, NOW)
  assert.equal(weekly.applied, 30)
  assert.ok(!weekly.complete)
  assert.equal(weekly.remaining, 20)
  assert.equal(weekly.percent, 60)
})

test('weekly progress counts all 7 days but daily target stays Mon-Fri', () => {
  const apps = [...nApps('2026-09-26', 12), ...nApps('2026-09-27', 12)] // Saturday + Sunday
  const weekly = computeWeekly(apps, 50, NOW)
  assert.equal(weekly.applied, 24) // weekends DO count toward weekly total
  const daily = computeDailyGoal(apps, 10, NOW)
  assert.ok(daily.weekdays.every((d) => d.count === 0), 'weekends do not satisfy weekdays')
})

test('streak counts consecutive completed weekdays', () => {
  // Monday + Tuesday complete; now = Wednesday before the day ends.
  const apps = [...nApps('2026-09-21', 10), ...nApps('2026-09-22', 10)]
  const streaks = computeStreaks(apps, 10, new Date(2026, 8, 23, 12, 0, 0))
  assert.equal(streaks.current, 2)
})

test('incomplete today keeps the streak alive up to the last completed weekday', () => {
  // Monday complete, Tuesday complete, but today's Wednesday has only 2 (not yet over).
  const apps = [...nApps('2026-09-21', 10), ...nApps('2026-09-22', 10), ...nApps('2026-09-23', 2)]
  const streaks = computeStreaks(apps, 10, new Date(2026, 8, 23, 8, 0, 0))
  assert.equal(streaks.current, 2)
})

test('weekends neither count nor break the streak', () => {
  // Friday 9/25 complete, weekend empty, Monday 9/28 complete; now = Tuesday 9/29.
  const apps = [...nApps('2026-09-25', 10), ...nApps('2026-09-28', 10)]
  const streaks = computeStreaks(apps, 10, new Date(2026, 8, 29, 12, 0, 0))
  assert.equal(streaks.current, 2) // Sat+Sun skipped, no break
})

test('streak breaks on an incomplete weekday', () => {
  const apps = [...nApps('2026-09-21', 10), ...nApps('2026-09-22', 3), ...nApps('2026-09-23', 10)]
  const streaks = computeStreaks(apps, 10, new Date(2026, 8, 23, 12, 0, 0))
  assert.equal(streaks.current, 1)
})

test('longest streak is tracked over all history', () => {
  // Week starting Mon 9/14: Mon-Fri all complete -> longest 5.
  const week1 = ['2026-09-14', '2026-09-15', '2026-09-16', '2026-09-17', '2026-09-18']
  const apps = week1.flatMap((d) => nApps(d, 10))
  const streaks = computeStreaks(apps, 10, NOW)
  assert.equal(streaks.longest, 5)
  // Today (Monday) isn't failed yet, so the current streak carries over the weekend.
  assert.equal(streaks.current, 5)
})

test('computeVolume: today / this week / this month / all time', () => {
  const apps = [
    ...nApps('2026-09-21', 3), // today (Mon), this week, this month
    ...nApps('2026-09-26', 2), // Saturday: this week, this month
    ...nApps('2026-08-15', 4), // last month
    ...nApps('2025-12-01', 1) // old
  ]
  const volume = computeVolume(apps, NOW)
  assert.equal(volume.today, 3)
  assert.equal(volume.thisWeek, 5)
  assert.equal(volume.thisMonth, 5)
  assert.equal(volume.allTime, 10)
})

test('weekly history retains past weeks (never deleted)', () => {
  const apps = [...nApps('2026-09-14', 42), ...nApps('2026-09-21', 37)]
  const history = computeWeeklyHistory(apps, 50, NOW, 12)
  const lastWeek = history.find((w) => w.weekKey === '2026-09-14')
  const thisWeek = history.find((w) => w.weekKey === '2026-09-21')
  assert.ok(lastWeek)
  assert.equal(lastWeek.applied, 42)
  assert.ok(thisWeek)
  assert.equal(thisWeek.applied, 37)
})

test('summaryStats wires everything together', () => {
  const apps = [...nApps('2026-09-21', 10), ...nApps('2026-09-22', 5)]
  const stats = summaryStats(apps, 10, 50, NOW)
  assert.equal(stats.counts.total, 15)
  assert.equal(stats.weekly.applied, 15)
  assert.equal(stats.daily.weekdays[0].complete, true)
  assert.equal(stats.daily.weekdays[1].complete, false)
  assert.equal(stats.streaks.current, 1)
})
