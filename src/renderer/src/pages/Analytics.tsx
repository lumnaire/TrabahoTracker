import { useMemo } from 'react'
import { CalendarDays, Flame, Target, TrendingUp, Trophy } from 'lucide-react'
import { formatRelative } from '@shared/dates.ts'
import {
  computeConsistency,
  computeDailySeries,
  computeMonthlySeries,
  computeResponseMetrics,
  computeVolume,
  computeWeeklyHistory
} from '@shared/goals.ts'
import { STATUS_LABELS, statusCounts } from '@shared/status.ts'
import { useAppStore } from '../store.ts'
import { useIsDark } from '../hooks/useIsDark.ts'
import { ActivityBarChart, STATUS_COLORS } from '../components/Charts.tsx'
import { SummaryCard } from '../components/SummaryCard.tsx'

const STATUS_KEYS = ['pending', 'no_response', 'processing', 'approved', 'rejected'] as const

export function Analytics(): React.ReactNode {
  const apps = useAppStore((s) => s.apps)
  const settings = useAppStore((s) => s.settings)
  const isDark = useIsDark()

  const dailyGoal = settings?.dailyGoal ?? 10
  const weeklyGoal = settings?.weeklyGoal ?? 50

  const volume = useMemo(() => computeVolume(apps, new Date()), [apps])
  const counts = useMemo(() => statusCounts(apps, new Date()), [apps])
  const metrics = useMemo(() => computeResponseMetrics(counts), [counts])
  const weeklyHistory = useMemo(
    () => computeWeeklyHistory(apps, weeklyGoal, new Date(), 12),
    [apps, weeklyGoal]
  )
  const dailySeries = useMemo(() => computeDailySeries(apps, new Date(), 30), [apps])
  const monthlySeries = useMemo(() => computeMonthlySeries(apps, new Date(), 6), [apps])
  const consistency = useMemo(
    () => computeConsistency(apps, dailyGoal, new Date()),
    [apps, dailyGoal]
  )

  const statusDist = STATUS_KEYS.map((key) => {
    const getKey = (): keyof typeof counts => {
      switch (key) {
        case 'pending':
          return 'pending'
        case 'no_response':
          return 'noResponse'
        case 'processing':
          return 'processing'
        case 'approved':
          return 'approved'
        case 'rejected':
          return 'rejected'
      }
    }
    const value = counts[getKey()]
    return {
      key,
      label: STATUS_LABELS[key],
      value,
      pct: apps.length > 0 ? Math.round((value / apps.length) * 100) : 0,
      color: STATUS_COLORS[key][isDark ? 'dark' : 'light']
    }
  })

  const lastUpdated = useMemo(
    () => (apps.length > 0 ? apps.reduce((a, b) => (b.updatedAt > a ? b.updatedAt : a), apps[0].updatedAt) : null),
    [apps]
  )

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-8 py-8">
      <header>
        <h1 className="text-xl font-bold tracking-tight text-app-text">Analytics</h1>
        <p className="mt-0.5 text-sm text-app-muted">
          A data-driven look at your job hunt.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <SummaryCard label="Today" value={volume.today} />
        <SummaryCard label="This Week" value={volume.thisWeek} />
        <SummaryCard label="This Month" value={volume.thisMonth} />
        <SummaryCard label="All Time" value={volume.allTime} />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-app-border bg-app-card p-6 shadow-card">
          <h2 className="text-sm font-semibold text-app-text">Status Distribution</h2>
          <p className="mb-4 text-xs text-app-faint">Counts and share of every pipeline stage</p>
          <div className="space-y-2.5">
            {statusDist.map((s) => (
              <div key={s.key} className="flex items-center gap-3">
                <span className="w-24 flex-none text-sm text-app-muted">{s.label}</span>
                <div className="h-8 flex-1 overflow-hidden rounded-lg bg-app-subtle">
                  <div
                    className="flex h-full items-center rounded-lg pl-2 text-xs font-semibold text-white transition-all duration-500"
                    style={{ width: `${Math.max(s.pct, s.value > 0 ? 6 : 0)}%`, background: s.color }}
                  >
                    {s.value > 0 ? s.value : null}
                  </div>
                </div>
                <span className="w-12 flex-none text-right text-sm font-bold text-app-text tabular-nums">
                  {s.pct}%
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-app-border bg-app-card p-6 shadow-card">
          <h2 className="text-sm font-semibold text-app-text">Response Metrics</h2>
          <p className="mb-4 text-xs text-app-faint">
            "No Response" is never counted as a rejection
          </p>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <Metric label="Response Rate" value={`${Math.round(metrics.responseRate)}%`} tone="accent" />
            <Metric label="No Response Rate" value={`${Math.round(metrics.noResponseRate)}%`} tone="muted" />
            <Metric label="Rejection Rate" value={`${Math.round(metrics.rejectionRate)}%`} tone="danger" />
            <Metric label="Processing Rate" value={`${Math.round(metrics.processingRate)}%`} tone="info" />
            <Metric label="Approval Rate" value={`${Math.round(metrics.approvalRate)}%`} tone="success" />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-app-border bg-app-card p-6 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-app-text">Daily Activity</h2>
              <p className="text-xs text-app-faint">Applications per day · last 30 days</p>
            </div>
            <TrendingUp className="h-4 w-4 text-app-faint" />
          </div>
          <ActivityBarChart
            data={dailySeries.map((d) => ({ label: d.label, key: d.dateKey, count: d.count }))}
            isDark={isDark}
          />
        </div>

        <div className="rounded-2xl border border-app-border bg-app-card p-6 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-app-text">Monthly Activity</h2>
              <p className="text-xs text-app-faint">Last 6 months</p>
            </div>
            <CalendarDays className="h-4 w-4 text-app-faint" />
          </div>
          <ActivityBarChart
            data={monthlySeries.map((m) => ({ label: m.label, key: m.monthKey, count: m.count }))}
            isDark={isDark}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-app-border bg-app-card p-6 shadow-card">
        <h2 className="text-sm font-semibold text-app-text">Weekly Activity</h2>
        <p className="mb-4 text-xs text-app-faint">Goal: {weeklyGoal} applications / week</p>
        {weeklyHistory.length === 0 ? (
          <p className="text-sm text-app-faint">No weeks tracked yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-app-border text-left text-xs font-semibold uppercase tracking-wide text-app-faint">
                  <th className="py-2.5 pr-4">Week</th>
                  <th className="py-2.5 pr-4">Applications</th>
                  <th className="py-2.5 pr-4">Goal</th>
                  <th className="py-2.5 pr-4">Progress</th>
                  <th className="py-2.5">Completion</th>
                </tr>
              </thead>
              <tbody>
                {[...weeklyHistory].reverse().map((row) => (
                  <tr key={row.weekKey} className="border-b border-app-border last:border-0">
                    <td className="py-3 pr-4 text-app-muted">{row.mondayLabel}</td>
                    <td className="py-3 pr-4 font-semibold text-app-text tabular-nums">{row.applied}</td>
                    <td className="py-3 pr-4 text-app-faint tabular-nums">{row.goal}</td>
                    <td className="py-3 pr-4">
                      <div className="h-2 w-40 overflow-hidden rounded-full bg-app-subtle">
                        <div
                          className={`h-full rounded-full ${row.complete ? 'bg-emerald-500' : 'bg-app-accent'}`}
                          style={{ width: `${Math.min(100, row.percent)}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-3">
                      {row.complete ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          <Trophy className="h-3.5 w-3.5" /> {row.percent}%
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-app-muted">{row.percent}%</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-app-border bg-app-card p-6 shadow-card">
        <h2 className="mb-4 text-sm font-semibold text-app-text">Application Consistency</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Consistency
            icon={<Flame className="h-4.5 w-4.5" />}
            label="Current weekday streak"
            value={`${consistency.currentStreak} day${consistency.currentStreak === 1 ? '' : 's'}`}
          />
          <Consistency
            icon={<Trophy className="h-4.5 w-4.5" />}
            label="Longest streak"
            value={`${consistency.longestStreak} day${consistency.longestStreak === 1 ? '' : 's'}`}
          />
          <Consistency
            icon={<Target className="h-4.5 w-4.5" />}
            label="Average / day"
            value={`${consistency.averagePerDay}`}
          />
          <Consistency
            icon={<TrendingUp className="h-4.5 w-4.5" />}
            label="Average / week"
            value={`${consistency.averagePerWeek}`}
          />
        </div>
        <p className="mt-4 text-xs text-app-faint">
          Consistency is measured across {consistency.daysTracked} tracked day
          {consistency.daysTracked === 1 ? '' : 's'} ({consistency.weeksTracked} week
          {consistency.weeksTracked === 1 ? '' : 's'}).{' '}
          {lastUpdated ? `Last updated ${formatRelative(lastUpdated)}.` : 'No activity yet.'}
        </p>
      </section>
    </div>
  )
}

function Metric({
  label,
  value,
  tone
}: {
  label: string
  value: string
  tone: 'accent' | 'success' | 'danger' | 'info' | 'muted'
}): React.ReactNode {
  const tones: Record<string, string> = {
    accent: 'text-app-accent',
    success: 'text-emerald-600 dark:text-emerald-400',
    danger: 'text-red-600 dark:text-red-400',
    info: 'text-blue-600 dark:text-blue-400',
    muted: 'text-app-muted'
  }
  return (
    <div className="rounded-xl border border-app-border bg-app-subtle/40 p-4">
      <div className={`text-2xl font-bold tabular-nums ${tones[tone]}`}>{value}</div>
      <div className="mt-0.5 text-xs font-medium text-app-muted">{label}</div>
    </div>
  )
}

function Consistency({
  icon,
  label,
  value
}: {
  icon: React.ReactNode
  label: string
  value: string
}): React.ReactNode {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-app-border bg-app-subtle/40 p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-app-accent-soft text-app-accent">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm font-bold text-app-text">{value}</div>
        <div className="text-[11px] text-app-muted">{label}</div>
      </div>
    </div>
  )
}