import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getEffectiveStatus, statusCounts, withEffectiveStatus } from '../src/shared/status.ts'
import type { Application } from '../src/shared/types.ts'

// Fixed "now": Monday 2026-09-21 12:00 local.
const now = new Date(2026, 8, 21, 12, 0, 0)

function app(partial: Partial<Application>): Application {
  return {
    id: 'a',
    companyName: 'Acme',
    companyEmail: 'hr@acme.com',
    position: 'Developer',
    status: 'pending',
    dateApplied: '2026-09-21',
    lastUpdated: '2026-09-21T09:00:00.000',
    jobSource: null,
    jobUrl: null,
    location: null,
    salary: null,
    contactPerson: null,
    notes: null,
    createdAt: '2026-09-21T09:00:00.000',
    updatedAt: '2026-09-21T09:00:00.000',
    ...partial
  }
}

test('Test 1: a newly created application is Pending', () => {
  const a = app({})
  assert.equal(a.status, 'pending')
  assert.equal(getEffectiveStatus(a.status, a.lastUpdated, now), 'pending')
})

test('Test 2: a Pending application 6 days old stays Pending', () => {
  const a = app({ lastUpdated: '2026-09-15T09:00:00.000' })
  assert.equal(getEffectiveStatus(a.status, a.lastUpdated, now), 'pending')
})

test('Test 3: a Pending application 7 days old becomes No Response', () => {
  const a = app({ lastUpdated: '2026-09-14T09:00:00.000' })
  assert.equal(getEffectiveStatus(a.status, a.lastUpdated, now), 'no_response')
})

test('Test 4: Processing never becomes No Response, regardless of age', () => {
  const a = app({ status: 'processing', lastUpdated: '2026-01-01T09:00:00.000' })
  assert.equal(getEffectiveStatus(a.status, a.lastUpdated, now), 'processing')
  const wide = app({ status: 'processing', lastUpdated: '2025-12-01T09:00:00.000' })
  assert.equal(getEffectiveStatus(wide.status, wide.lastUpdated, now), 'processing')
})

test('Test 4b: Approved / Rejected are never overridden', () => {
  assert.equal(getEffectiveStatus('approved', '2026-01-01T09:00:00.000', now), 'approved')
  assert.equal(getEffectiveStatus('rejected', '2026-01-01T09:00:00.000', now), 'rejected')
})

test('Test 5: No Response -> Pending restarts the 7-day timer', () => {
  const oldTimer = app({ status: 'pending', lastUpdated: '2026-09-12T09:00:00.000' })
  assert.equal(getEffectiveStatus(oldTimer.status, oldTimer.lastUpdated, now), 'no_response')

  // After the user moves it back to Pending, lastUpdated = now and the timer restarts.
  const restarted = app({ status: 'pending', lastUpdated: '2026-09-21T12:00:00.000' })
  assert.equal(getEffectiveStatus(restarted.status, restarted.lastUpdated, now), 'pending')
})

test('statusCounts uses effective status and never mutates stored status', () => {
  const apps = [
    app({ status: 'pending', lastUpdated: '2026-09-21T09:00:00.000' }),
    app({ status: 'pending', lastUpdated: '2026-09-21T09:00:00.000' }),
    app({ status: 'pending', lastUpdated: '2026-09-14T09:00:00.000' }), // auto -> no_response
    app({ status: 'processing' }),
    app({ status: 'approved' }),
    app({ status: 'rejected' })
  ]
  const counts = statusCounts(apps, now)
  assert.equal(counts.total, 6)
  assert.equal(counts.pending, 2)
  assert.equal(counts.noResponse, 1)
  assert.equal(counts.processing, 1)
  assert.equal(counts.approved, 1)
  assert.equal(counts.rejected, 1)
  // Stored statuses untouched.
  assert.equal(apps[2].status, 'pending')
})

test('withEffectiveStatus attaches the computed status', () => {
  const a = withEffectiveStatus(app({ status: 'pending', lastUpdated: '2026-09-14T09:00:00.000' }), now)
  assert.equal(a.effectiveStatus, 'no_response')
  assert.equal(a.status, 'pending')
})