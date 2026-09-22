import { useMemo, useState } from 'react'
import {
  ArrowDownAZ,
  ArrowUpAZ,
  ListFilter,
  MoreVertical,
  PackageSearch,
  Plus,
  Search,
  Clock3
} from 'lucide-react'
import { formatMediumDate, formatRelative } from '@shared/dates.ts'
import { compareStatus, withEffectiveStatus, STATUS_ORDER, STATUS_LABELS } from '@shared/status.ts'
import type { Application, ApplicationStatus } from '@shared/types.ts'
import { useAppStore } from '../store.ts'
import { useUiStore, type SortKey, type StatusFilter } from '../uiStore.ts'
import { StatusBadge } from '../components/StatusBadge.tsx'
import { RowActions } from '../components/RowActions.tsx'
import { EmptyState } from '../components/EmptyState.tsx'

const FILTERS: StatusFilter[] = ['all', ...STATUS_ORDER]

export function Track(): React.ReactNode {
  const apps = useAppStore((s) => s.apps)
  const filter = useUiStore((s) => s.trackFilter)
  const query = useUiStore((s) => s.trackQuery)
  const sort = useUiStore((s) => s.trackSort)
  const page = useUiStore((s) => s.trackPage)
  const pageSize = useUiStore((s) => s.pageSize)
  const setFilter = useUiStore((s) => s.setTrackFilter)
  const setQuery = useUiStore((s) => s.setTrackQuery)
  const setSort = useUiStore((s) => s.setTrackSort)
  const setPage = useUiStore((s) => s.setTrackPage)
  const setModal = useUiStore((s) => s.setModal)

  const [sortOpen, setSortOpen] = useState(false)

  const withEffective = useMemo(
    () => apps.map((a) => withEffectiveStatus(a)),
    [apps]
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = withEffective
    if (filter !== 'all') {
      list = list.filter((a) => a.effectiveStatus === filter)
    }
    if (q) {
      list = list.filter(
        (a) =>
          a.companyName.toLowerCase().includes(q) ||
          (a.companyEmail ?? '').toLowerCase().includes(q) ||
          a.position.toLowerCase().includes(q) ||
          (a.contactPerson ?? '').toLowerCase().includes(q) ||
          (a.notes ?? '').toLowerCase().includes(q)
      )
    }
    const sorted = [...list]
    switch (sort) {
      case 'oldest':
        sorted.sort(
          (a, b) => a.dateApplied.localeCompare(b.dateApplied) || a.createdAt.localeCompare(b.createdAt)
        )
        break
      case 'company-az':
        sorted.sort((a, b) => a.companyName.localeCompare(b.companyName))
        break
      case 'company-za':
        sorted.sort((a, b) => b.companyName.localeCompare(a.companyName))
        break
      case 'recent':
        sorted.sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated))
        break
      case 'status':
        sorted.sort((a, b) => compareStatus(a.effectiveStatus, b.effectiveStatus))
        break
      case 'newest':
      default:
        sorted.sort(
          (a, b) => b.dateApplied.localeCompare(a.dateApplied) || b.createdAt.localeCompare(a.createdAt)
        )
    }
    return sorted
  }, [withEffective, filter, query, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * pageSize
  const visible = filtered.slice(start, start + pageSize)

  const counts = useMemo(() => {
    const m = new Map<StatusFilter, number>([['all', withEffective.length]])
    for (const s of STATUS_ORDER) m.set(s, 0)
    for (const a of withEffective) {
      m.set(a.effectiveStatus, (m.get(a.effectiveStatus) ?? 0) + 1)
    }
    return m
  }, [withEffective])

  if (apps.length === 0) {
    return (
      <div className="mx-auto max-w-5xl px-8 py-10">
        <PageHeader />
        <EmptyState
          icon={<PackageSearch className="h-7 w-7" />}
          title="No applications yet."
          message="Start tracking your job search by adding your first application."
          action={
            <button
              onClick={() => setModal({ kind: 'add' })}
              className="inline-flex items-center gap-2 rounded-xl bg-app-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-app-accent-hover"
            >
              <Plus className="h-4 w-4" /> Add Application
            </button>
          }
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-8 py-8">
      <PageHeader />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-app-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search company, position, email…"
            className="w-80 rounded-xl border border-app-border bg-app-card py-2.5 pl-10 pr-4 text-sm text-app-text placeholder:text-app-faint outline-none transition-colors focus:border-app-accent focus:ring-2 focus:ring-app-accent/25"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-app-border bg-app-card px-2 py-1.5">
          <ListFilter className="mx-1 h-4 w-4 text-app-faint" />
          {FILTERS.map((f) => {
            const active = filter === f
            const label = f === 'all' ? 'All' : STATUS_LABELS[f]
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  active
                    ? 'bg-app-accent text-white'
                    : 'text-app-muted hover:bg-app-subtle hover:text-app-text'
                }`}
              >
                {label}
                <span className={active ? 'ml-1 opacity-80' : 'ml-1 text-app-faint'}>
                  {counts.get(f) ?? 0}
                </span>
              </button>
            )
          })}
        </div>

        <div className="relative ml-auto">
          <button
            onClick={() => setSortOpen((o) => !o)}
            className="flex items-center gap-2 rounded-xl border border-app-border bg-app-card px-3.5 py-2.5 text-sm font-medium text-app-muted transition-colors hover:text-app-text"
          >
            {sort.includes('az') ? (
              sort === 'company-az' ? (
                <ArrowDownAZ className="h-4 w-4" />
              ) : (
                <ArrowUpAZ className="h-4 w-4" />
              )
            ) : (
              <MoreVertical className="h-4 w-4" />
            )}
            {SORT_LABELS[sort]}
          </button>
          {sortOpen ? (
            <div className="absolute right-0 top-full z-30 mt-1 w-52 overflow-hidden rounded-xl border border-app-border bg-app-card py-1 shadow-lg animate-fade">
              {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                <button
                  key={key}
                  onClick={() => {
                    setSort(key)
                    setSortOpen(false)
                  }}
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-app-subtle ${
                    sort === key ? 'font-semibold text-app-accent' : 'text-app-muted'
                  }`}
                >
                  {SORT_LABELS[key]}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<PackageSearch className="h-7 w-7" />}
          title="No applications found."
          message="Try changing your filters or search query."
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-app-border bg-app-card shadow-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-app-border text-left text-xs font-semibold uppercase tracking-wide text-app-faint">
                  <th className="px-5 py-3.5">Company</th>
                  <th className="px-4 py-3.5">Position</th>
                  <th className="hidden px-4 py-3.5 lg:table-cell">Email</th>
                  <th className="px-4 py-3.5">Applied</th>
                  <th className="hidden px-4 py-3.5 xl:table-cell">Last Update</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="w-14 px-2 py-3.5" />
                </tr>
              </thead>
              <tbody>
                {visible.map((app) => (
                  <Row
                    key={app.id}
                    app={app}
                    onOpen={() => setModal({ kind: 'details', id: app.id })}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-app-muted">
            <span>
              Showing{' '}
              <span className="font-medium text-app-text">
                {filtered.length === 0 ? 0 : start + 1}–{Math.min(start + pageSize, filtered.length)}
              </span>{' '}
              of <span className="font-medium text-app-text">{filtered.length}</span> applications
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(safePage - 1)}
                disabled={safePage <= 1}
                className="rounded-lg border border-app-border px-3 py-1.5 font-medium transition-colors hover:bg-app-subtle disabled:opacity-40"
              >
                Previous
              </button>
              <span className="px-1 tabular-nums">
                {safePage} / {totalPages}
              </span>
              <button
                onClick={() => setPage(safePage + 1)}
                disabled={safePage >= totalPages}
                className="rounded-lg border border-app-border px-3 py-1.5 font-medium transition-colors hover:bg-app-subtle disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

const SORT_LABELS: Record<SortKey, string> = {
  newest: 'Newest Applied',
  oldest: 'Oldest Applied',
  'company-az': 'Company A–Z',
  'company-za': 'Company Z–A',
  recent: 'Recently Updated',
  status: 'Status'
}

function PageHeader(): React.ReactNode {
  const setModal = useUiStore((s) => s.setModal)
  return (
    <div className="mb-6 flex items-center justify-between">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-app-text">Track Applications</h1>
        <p className="mt-0.5 text-sm text-app-muted">
          Everything you've sent, all in one place.
        </p>
      </div>
      <button
        onClick={() => setModal({ kind: 'add' })}
        className="inline-flex items-center gap-2 rounded-xl bg-app-accent px-4 py-2.5 text-sm font-semibold text-white shadow-card transition-colors hover:bg-app-accent-hover"
      >
        <Plus className="h-4 w-4" /> Add Application
      </button>
    </div>
  )
}

function Row({
  app,
  onOpen
}: {
  app: Application & { effectiveStatus: ApplicationStatus }
  onOpen: () => void
}): React.ReactNode {
  return (
    <tr
      onClick={onOpen}
      className="cursor-pointer border-b border-app-border last:border-0 transition-colors hover:bg-app-subtle/60"
    >
      <td className="px-5 py-3.5">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onOpen()
          }}
          className="text-left font-medium text-app-text hover:text-app-accent"
        >
          {app.companyName}
        </button>
      </td>
      <td className="px-4 py-3.5 text-app-muted">{app.position}</td>
      <td className="hidden px-4 py-3.5 text-app-muted lg:table-cell">
        {app.companyEmail ? app.companyEmail : <span className="text-app-faint">—</span>}
      </td>
      <td className="px-4 py-3.5">
        <span className="inline-flex items-center gap-1.5 text-app-muted">
          <Clock3 className="h-3.5 w-3.5 text-app-faint" />
          {formatMediumDate(app.dateApplied)}
        </span>
      </td>
      <td className="hidden px-4 py-3.5 text-app-faint xl:table-cell">
        {formatRelative(app.lastUpdated)}
      </td>
      <td className="px-4 py-3.5">
        <StatusBadge status={app.effectiveStatus} size="sm" />
      </td>
      <td className="px-2 py-3.5" onClick={(e) => e.stopPropagation()}>
        <RowActions app={app} />
      </td>
    </tr>
  )
}