import { NO_RESPONSE_DAYS } from './constants.ts'
import { daysSince } from './dates.ts'
import type { Application, ApplicationStatus, StatusCounts } from './types.ts'

export const STATUS_ORDER: readonly ApplicationStatus[] = [
  'pending',
  'no_response',
  'processing',
  'approved',
  'rejected'
]

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  pending: 'Pending',
  no_response: 'No Response',
  processing: 'Processing',
  approved: 'Approved',
  rejected: 'Rejected'
}

export const STATUS_DESCRIPTIONS: Record<ApplicationStatus, string> = {
  pending: 'Recently submitted, awaiting a response.',
  no_response: 'No update for 7 days or more.',
  processing: 'Company acknowledged or is actively reviewing.',
  approved: 'Progressed successfully / accepted.',
  rejected: 'Declined by the company.'
}

const statusOrderRank = new Map<ApplicationStatus, number>(
  STATUS_ORDER.map((s, i) => [s, i])
)

/**
 * The automatic "No Response" rule:
 * a stored Pending status whose lastUpdated is 7+ days ago is *effectively*
 * No Response. Never applies to Processing / Approved / Rejected.
 *
 * This is computed dynamically and never mutates the database.
 */
export function getEffectiveStatus(
  status: ApplicationStatus,
  lastUpdated: string,
  now: Date = new Date()
): ApplicationStatus {
  if (status === 'pending' && daysSince(lastUpdated, now) >= NO_RESPONSE_DAYS) {
    return 'no_response'
  }
  return status
}

/** Adds the computed effective status to every application. */
export function withEffectiveStatus<A extends Application>(
  app: A,
  now: Date = new Date()
): A & { effectiveStatus: ApplicationStatus } {
  return { ...app, effectiveStatus: getEffectiveStatus(app.status, app.lastUpdated, now) }
}

export function isTerminal(status: ApplicationStatus): boolean {
  return status === 'approved' || status === 'rejected'
}

export function compareStatus(a: ApplicationStatus, b: ApplicationStatus): number {
  return (statusOrderRank.get(a) ?? 0) - (statusOrderRank.get(b) ?? 0)
}

export function statusCounts(
  applications: readonly Application[],
  now: Date = new Date()
): StatusCounts {
  const counts: StatusCounts = {
    total: applications.length,
    pending: 0,
    noResponse: 0,
    processing: 0,
    approved: 0,
    rejected: 0
  }
  for (const app of applications) {
    const effective = getEffectiveStatus(app.status, app.lastUpdated, now)
    switch (effective) {
      case 'pending':
        counts.pending++
        break
      case 'no_response':
        counts.noResponse++
        break
      case 'processing':
        counts.processing++
        break
      case 'approved':
        counts.approved++
        break
      case 'rejected':
        counts.rejected++
        break
    }
  }
  return counts
}