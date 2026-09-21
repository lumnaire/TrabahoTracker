import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  addDays,
  currentWeekKey,
  dateKeyOf,
  daysSince,
  diffDateKeys,
  eachDayBetween,
  isWeekday,
  toDateKey,
  weekdayIndex,
  weekKey,
  fromDateKey
} from '../src/shared/dates.ts'

test('toDateKey uses local calendar, not UTC', () => {
  // 2026-09-21 00:30 local — must not shift to Sep 20.
  const d = new Date(2026, 8, 21, 0, 30, 0)
  assert.equal(toDateKey(d), '2026-09-21')
  // Late evening 23:30 must stay on the same local day.
  const late = new Date(2026, 8, 21, 23, 30, 0)
  assert.equal(toDateKey(late), '2026-09-21')
})

test('fromDateKey/toDateKey round-trip', () => {
  const key = '2026-09-21'
  const date = fromDateKey(key)
  assert.equal(date.getFullYear(), 2026)
  assert.equal(date.getMonth(), 8)
  assert.equal(date.getDate(), 21)
  assert.equal(toDateKey(date), key)
})

test('weekKey returns the Monday of the week', () => {
  // Wednesday 2026-09-23 -> Monday 2026-09-21
  assert.equal(weekKey('2026-09-23'), '2026-09-21')
  // Monday itself
  assert.equal(weekKey('2026-09-21'), '2026-09-21')
  // Sunday -> the Monday of the previous week
  assert.equal(weekKey('2026-09-27'), '2026-09-21')
  // Saturday stays within the same week
  assert.equal(weekKey('2026-09-26'), '2026-09-21')
})

test('currentWeekKey matches the local week of now', () => {
  const now = new Date(2026, 8, 23, 10, 0, 0)
  assert.equal(currentWeekKey(now), '2026-09-21')
})

test('weekdayIndex and isWeekday', () => {
  assert.equal(weekdayIndex('2026-09-21'), 1) // Monday
  assert.equal(weekdayIndex('2026-09-25'), 5) // Friday
  assert.equal(weekdayIndex('2026-09-26'), 6) // Saturday
  assert.equal(weekdayIndex('2026-09-27'), 0) // Sunday
  assert.ok(isWeekday('2026-09-21'))
  assert.ok(isWeekday('2026-09-25'))
  assert.ok(!isWeekday('2026-09-26'))
  assert.ok(!isWeekday('2026-09-27'))
})

test('addDays handles month boundaries', () => {
  assert.equal(addDays('2026-09-30', 1), '2026-10-01')
  assert.equal(addDays('2026-03-01', -1), '2026-02-28')
})

test('eachDayBetween is inclusive', () => {
  const days = eachDayBetween('2026-09-21', '2026-09-25')
  assert.deepEqual(days, ['2026-09-21', '2026-09-22', '2026-09-23', '2026-09-24', '2026-09-25'])
})

test('diffDateKeys counts calendar days', () => {
  assert.equal(diffDateKeys('2026-09-28', '2026-09-21'), 7)
  assert.equal(diffDateKeys('2026-09-21', '2026-09-28'), -7)
})

test('daysSince uses wall-clock timestamps stored as local ISO', () => {
  const now = new Date(2026, 8, 21, 12, 0, 0)
  assert.ok(daysSince('2026-09-14T09:00:00.000', now) >= 7)
  assert.ok(daysSince('2026-09-15T09:00:00.000', now) < 7)
  assert.ok(daysSince('2026-09-21T11:00:00.000', now) < 1)
})

test('dateKeyOf extracts the local calendar date from an ISO timestamp', () => {
  assert.equal(dateKeyOf('2026-09-21T23:59:59.999'), '2026-09-21')
})