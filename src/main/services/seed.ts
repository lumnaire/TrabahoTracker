import { randomUUID } from 'node:crypto'
import { addDays, toLocalIso, todayKey } from '@shared/dates.ts'
import type { Application, ApplicationStatus, StatusHistoryEntry } from '@shared/types.ts'
import { clearAllApplications, insertApplicationRows, insertHistoryRows, listApplications } from './applications.ts'
import { getSettings, updateSettings } from './settings.ts'

interface SeedSpec {
  companyName: string
  companyEmail: string
  position: string
  daysAgo: number
  status: ApplicationStatus
  jobSource: string
  location: string
  salary: string | null
  contactPerson: string | null
  notes: string | null
}

// Development-only sample dataset. ~20 realistic applications spread across the
// last two months so dashboards, charts, weekly goals and the 7-day
// No Response automation all have something to work with.
const SEED: SeedSpec[] = [
  { companyName: 'Acme Corporation', companyEmail: 'hr@acmecorp.dev', position: 'Frontend Developer', daysAgo: 0, status: 'pending', jobSource: 'LinkedIn', location: 'Manila, PH', salary: 'PHP 90,000 – 110,000', contactPerson: 'Ana Reyes', notes: 'Portfolio + 2 take-home tasks. Strong cultural fit interview.' },
  { companyName: 'TechLabs PH', companyEmail: 'careers@techlabs.ph', position: 'Full Stack Engineer', daysAgo: 0, status: 'pending', jobSource: 'JobStreet', location: 'Makati, PH', salary: 'PHP 95,000', contactPerson: null, notes: 'Referred by former teammate.' },
  { companyName: 'Startup PH', companyEmail: 'jobs@startup.ph', position: 'React Developer', daysAgo: 1, status: 'pending', jobSource: 'LinkedIn', location: 'Remote', salary: null, contactPerson: 'Miguel Santos', notes: null },
  { companyName: 'Nimbus Cloud', companyEmail: 'talent@nimbuscloud.io', position: 'Software Engineer II', daysAgo: 1, status: 'processing', jobSource: 'Direct', location: 'Remote', salary: 'USD 2,400/mo', contactPerson: 'Priya Sharma', notes: 'Completed first interview, waiting on second round.' },
  { companyName: 'QuantWorks', companyEmail: 'recruiting@quantworks.com', position: 'Data Analyst', daysAgo: 2, status: 'pending', jobSource: 'Indeed', location: 'BGC, Taguig', salary: 'PHP 70,000', contactPerson: null, notes: null },
  { companyName: 'WebCo Digital', companyEmail: 'careers@webcodigital.ph', position: 'Backend Developer', daysAgo: 3, status: 'processing', jobSource: 'JobStreet', location: 'Quezon City, PH', salary: 'PHP 85,000', contactPerson: 'Liza Tan', notes: 'Coding challenge sent — 14 day deadline.' },
  { companyName: 'PixelForge', companyEmail: 'jobs@pixelforge.io', position: 'UI Engineer', daysAgo: 4, status: 'pending', jobSource: 'OnlineJobs', location: 'Remote', salary: null, contactPerson: null, notes: null },
  { companyName: 'FinEdge', companyEmail: 'hr@finedge.com.ph', position: 'Full Stack Developer', daysAgo: 5, status: 'pending', jobSource: 'LinkedIn', location: 'Makati, PH', salary: 'PHP 100,000+', contactPerson: 'Carlo Dizon', notes: 'Recruiter phone screen coming up.' },
  { companyName: 'MediLogix', companyEmail: 'talent@medilogix.health', position: 'Frontend Developer', daysAgo: 6, status: 'pending', jobSource: 'Indeed', location: 'Manila, PH', salary: null, contactPerson: null, notes: null },
  { companyName: 'ShipFast Logistics', companyEmail: 'careers@shipfast.ph', position: 'Software Developer', daysAgo: 9, status: 'no_response', jobSource: 'JobStreet', location: 'Parañaque, PH', salary: 'PHP 60,000', contactPerson: null, notes: 'No reply after 7 days.' },
  { companyName: 'GreenGrid Energy', companyEmail: 'jobs@greengrid.io', position: 'Data Engineer', daysAgo: 10, status: 'no_response', jobSource: 'LinkedIn', location: 'Remote', salary: null, contactPerson: 'Karen Lim', notes: null },
  { companyName: 'SocialPulse', companyEmail: 'hr@socialpulse.app', position: 'Web Developer', daysAgo: 12, status: 'no_response', jobSource: 'OnlineJobs', location: 'Remote', salary: 'USD 1,800/mo', contactPerson: null, notes: null },
  { companyName: 'PayBridge', companyEmail: 'talent@paybridge.fin', position: 'Full Stack Engineer', daysAgo: 14, status: 'processing', jobSource: 'Direct', location: 'Bonifacio Global City', salary: 'PHP 120,000', contactPerson: 'Marco Uy', notes: 'Final interview passed — references requested.' },
  { companyName: 'CloudNest', companyEmail: 'recruiting@cloudnest.co', position: 'Frontend Developer', daysAgo: 16, status: 'no_response', jobSource: 'Indeed', location: 'Remote', salary: null, contactPerson: null, notes: null },
  { companyName: 'HealthTrack', companyEmail: 'careers@healthtrack.ph', position: 'JavaScript Developer', daysAgo: 20, status: 'rejected', jobSource: 'JobStreet', location: 'Manila, PH', salary: null, contactPerson: null, notes: 'Standard rejection after technical screen.' },
  { companyName: 'Streamly', companyEmail: 'jobs@streamly.tv', position: 'React Native Developer', daysAgo: 24, status: 'processing', jobSource: 'LinkedIn', location: 'Remote', salary: 'USD 3,000/mo', contactPerson: 'Bea Cruz', notes: 'Take-home assignment under review.' },
  { companyName: 'DataWaves', companyEmail: 'hr@datawaves.io', position: 'Full Stack Developer', daysAgo: 28, status: 'rejected', jobSource: 'Indeed', location: 'Remote', salary: null, contactPerson: null, notes: null },
  { companyName: 'MetroBank PH', companyEmail: 'careers@metrobank.ph', position: 'Software Engineer', daysAgo: 33, status: 'rejected', jobSource: 'Direct', location: 'Makati, PH', salary: null, contactPerson: null, notes: 'Position filled internally.' },
  { companyName: 'AuroraTech', companyEmail: 'talent@auroratech.dev', position: 'Senior Frontend Engineer', daysAgo: 40, status: 'approved', jobSource: 'LinkedIn', location: 'Manila, PH', salary: 'PHP 150,000', contactPerson: 'Josefina Ramos', notes: 'Offer received! Negotiating start date.' },
  { companyName: 'CodeCraft PH', companyEmail: 'jobs@codecraft.ph', position: 'Web Developer', daysAgo: 46, status: 'approved', jobSource: 'JobStreet', location: 'Quezon City, PH', salary: 'PHP 80,000', contactPerson: null, notes: 'Accepted offer — onboarding next month.' }
]

/** Load 20 sample applications (development only). Replaces current data. */
export function seedData(): { count: number } {
  const existing = listApplications().length
  if (existing > 0) {
    clearAllApplications()
  }

  const today = todayKey()
  const apps: Application[] = SEED.map((spec) => {
    const dateApplied = addDays(today, -spec.daysAgo)
    const createdAt = iso({ daysAgo: spec.daysAgo })
    const lastUpdated = iso({ daysAgo: spec.daysAgo, hour: 9 })
    return {
      id: randomUUID(),
      companyName: spec.companyName,
      companyEmail: spec.companyEmail,
      position: spec.position,
      status: spec.status,
      dateApplied,
      lastUpdated,
      jobSource: spec.jobSource,
      jobUrl: null,
      location: spec.location,
      salary: spec.salary,
      contactPerson: spec.contactPerson,
      notes: spec.notes,
      createdAt,
      updatedAt: lastUpdated
    }
  })
  insertApplicationRows(apps)

  const history: StatusHistoryEntry[] = apps.flatMap((app) => {
    const submitted: StatusHistoryEntry = {
      id: randomUUID(),
      applicationId: app.id,
      oldStatus: null,
      newStatus: 'pending',
      note: 'Application submitted',
      changedAt: app.createdAt
    }
    if (app.status === 'pending' || app.status === 'no_response') return [submitted]
    const moved = {
      id: randomUUID(),
      applicationId: app.id,
      oldStatus: 'pending' as const,
      newStatus: app.status,
      note: statusNote(app.status),
      changedAt: app.lastUpdated
    }
    return [submitted, moved]
  })
  if (history.length > 0) insertHistoryRows(history)

  const settings = getSettings()
  if (!settings.onboarded) {
    updateSettings({ onboarded: true })
  }

  return { count: apps.length }
}

function statusNote(status: ApplicationStatus): string {
  switch (status) {
    case 'processing':
      return 'Company acknowledged the application'
    case 'approved':
      return 'Application accepted'
    case 'rejected':
      return 'Application declined'
    default:
      return 'Status updated'
  }
}

/** Local ISO timestamp `daysAgo` days back, around `hour` local time. */
function iso(opts: { daysAgo: number; hour?: number; minute?: number }): string {
  const d = new Date()
  d.setDate(d.getDate() - opts.daysAgo)
  d.setHours(opts.hour ?? 9, opts.minute ?? 15, 0, 0)
  return toLocalIso(d)
}