import { useMemo } from 'react'
import {
  Briefcase,
  CheckCircle2,
  Clock,
  Loader2,
  RadioTower,
  TrendingUp,
  XCircle,
  ArrowRight,
  Target,
  CalendarCheck,
  Sparkles
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { formatMediumDate, formatRelative, todayKey } from '@shared/dates.ts'
import {
  computeDailySeries,
  computeResponseMetrics,
  computeWeekly,
  computeWeeklyHistory,
  summaryStats
} from '@shared/goals.ts'
import { withEffectiveStatus } from '@shared/status.ts'
import type { Application } from '@shared/types.ts'
import { useAppStore } from '../store.ts'
import { useUiStore } from '../uiStore.ts'
import { useIsDark } from '../hooks/useIsDark.ts'
import { StatCard } from '../components/StatCard.tsx'
import { ProgressBar } from '../components/ProgressBar.tsx'
import { StatusBadge } from '../components/StatusBadge.tsx'
import { WeekdayTracker } from '../components/WeekdayTracker.tsx'
import { ActivityBarChart, StatusDonut } from '../components/Charts.tsx'

export function Dashboard(): React.ReactNode {
  const apps = useAppStore((s) => s.apps)
  const settings = useAppStore((s) => s.settings)
  const appInfo = useUiStore((s) => s.appInfo)
  const goTrack = useUiStore((s) => s.goTrack)
  const setModal = useUiStore((s) => s.setModal)
  const isDark = useIsDark()

  const dailyGoal = settings?.dailyGoal ?? 10
  const weeklyGoal = settings?.weeklyGoal ?? 50

  const stats = useMemo(() => summaryStats(apps, dailyGoal, weeklyGoal), [apps, dailyGoal, weeklyGoal])
  const recent = useMemo(
    () => [...apps].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6),
    [apps]
  )
  const series = useMemo(() => computeDailySeries(apps, new Date(), 14), [apps])
  const weeklyHistory = useMemo(() => computeWeeklyHistory(apps, weeklyGoal, new Date(), 2), [apps, weeklyGoal])
  const metrics = useMemo(() => computeResponseMetrics(stats.counts), [stats.counts])

  const row = computeWeekly(apps, weeklyGoal, new Date())
  const currentWeek = row.weekKey

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }, [])

  const name = settings?.name?.trim() || appInfo?.userName || 'there'

  const CARD_DEFS: {
    label: string
    value: number
    icon: LucideIcon
    accent: string
    filter: StatusKey
  }[] = [
    { label: 'Total Applications', value: stats.counts.total, icon: Briefcase, accent: 'bg-app-accent-soft text-app-accent', filter: 'all' },
    { label: 'Pending', value: stats.counts.pending, icon: Clock, accent: 'bg-amber-500/10 text-amber-600 dark:text-amber-400', filter: 'pending' },
    { label: 'No Response', value: stats.counts.noResponse, icon: RadioTower, accent: 'bg-slate-500/10 text-slate-500 dark:text-slate-400', filter: 'no_response' },
    { label: 'Processing', value: stats.counts.processing, icon: Loader2, accent: 'bg-blue-500/10 text-blue-600 dark:text-blue-400', filter: 'processing' },
    { label: 'Approved', value: stats.counts.approved, icon: CheckCircle2, accent: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', filter: 'approved' },
    { label: 'Rejected', value: stats.counts.rejected, icon: XCircle, accent: 'bg-red-500/10 text-red-600 dark:text-red-400', filter: 'rejected' }
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-8 py-8">
      <header>
        <h1 className="text-xl font-bold tracking-tight text-app-text">
          {greeting}, {name} 👋
        </h1>
        <p className="mt-0.5 text-sm text-app-muted">Keep your job search moving forward.</p>
      </header>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {CARD_DEFS.map((c) => (
          <StatCard
            key={c.label}
            label={c.label}
            value={c.value}
            icon={c.icon}
            accent={c.accent}
            onClick={() => goTrack(c.filter)}
          />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <WeeklyGoalCard
          applied={stats.weekly.applied}
          weeklyGoal={weeklyGoal}
          complete={stats.weekly.complete}
          onNavigate={() => goTrack('all')}
        />
        <DailyGoalCard todayOk={stats.daily.todayOk} todayCount={todayCount(apps)} dailyGoal={dailyGoal} />
      </section>

      <section className="rounded-2xl border border-app-border bg-app-card p-6 shadow-card">
        <div className="mb-1 flex items-center gap-2">
          <CalendarCheck className="h-4 w-4 text-app-accent" />
          <h2 className="text-sm font-semibold text-app-text">This Week</h2>
        </div>
        <p className="mb-5 text-xs text-app-faint">
          Week of {formatMediumDate(currentWeek)} · {dailyGoal}/day on weekdays
        </p>
        <WeekdayTracker
          daily={stats.daily}
          dailyGoal={dailyGoal}
          streak={stats.streaks.current}
        />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-app-border bg-app-card p-6 shadow-card xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-app-text">Application Activity</h2>
              <p className="text-xs text-app-faint">Last 14 days</p>
            </div>
            <TrendingUp className="h-4 w-4 text-app-faint" />
          </div>
          <ActivityBarChart
            data={series.map((d) => ({ label: d.label, key: d.dateKey, count: d.count }))}
            isDark={isDark}
          />
        </div>

        <div className="rounded-2xl border border-app-border bg-app-card p-6 shadow-card">
          <h2 className="text-sm font-semibold text-app-text">Status Distribution</h2>
          <p className="mb-3 text-xs text-app-faint">Where everything stands</p>
          <StatusDonut counts={stats.counts} isDark={isDark} />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <WeeklyPerformance history={weeklyHistory} currentApplied={stats.weekly.applied} weeklyGoal={weeklyGoal} />
        <div className="rounded-2xl border border-app-border bg-app-card p-6 shadow-card">
          <h2 className="text-sm font-semibold text-app-text">Response Rate</h2>
          <p className="text-xs text-app-faint">Processing + Approved + Rejected</p>
          <div className="mt-4 flex items-end gap-2">
            <span className="text-4xl font-bold tracking-tight text-app-text tabular-nums">
              {Math.round(metrics.responseRate)}%
            </span>
            <span className="pb-1.5 text-sm text-app-faint">
              of {stats.counts.total} applications
            </span>
          </div>
          <div className="mt-5 space-y-2 text-sm">
            <RateRow label="Approval" pct={metrics.approvalRate} />
            <RateRow label="Processing" pct={metrics.processingRate} />
            <RateRow label="Rejected" pct={metrics.rejectionRate} />
          </div>
        </div>

        <RecentApplications apps={recent} onOpenDetails={(id) => setModal({ kind: 'details', id })} onViewAll={() => goTrack('all')} />
      </section>

      {apps.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-app-border-strong bg-app-subtle/40 px-6 py-12 text-center">
          <Sparkles className="h-8 w-8 text-app-faint" />
          <div>
            <h3 className="text-base font-semibold text-app-text">Let's get started</h3>
            <p className="mt-1 text-sm text-app-muted">
              Your dashboard and goals come alive once you add your first application.
            </p>
          </div>
          <button
            onClick={() => setModal({ kind: 'add' })}
            className="rounded-xl bg-app-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-app-accent-hover"
          >
            Add your first application
          </button>
        </div>
      ) : null}
    </div>
  )
}

type StatusKey = 'all' | 'no_response' | 'pending' | 'processing' | 'approved' | 'rejected'

function todayCount(apps: Application[]): number {
  return apps.filter((a) => a.dateApplied === todayKey()).length
}

function WeeklyGoalCard({
  applied,
  weeklyGoal,
  complete,
  onNavigate
}: {
  applied: number
  weeklyGoal: number
  complete: boolean
  onNavigate: () => void
}): React.ReactNode {
  const pct = Math.min(100, Math.round((applied / weeklyGoal) * 100))
  const remaining = Math.max(0, weeklyGoal - applied)
  return (
    <div className="rounded-2xl border border-app-border bg-app-card p-6 shadow-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-app-accent" />
          <h2 className="text-sm font-semibold text-app-text">Weekly Goal</h2>
        </div>
        <button onClick={onNavigate} className="text-xs font-medium text-app-accent hover:underline">
          Week resets Monday
        </button>
      </div>

      {complete ? (
        <div className="mt-4 rounded-xl bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-600 dark:text-emerald-400 animate-fade">
          🎉 Weekly goal completed!
        </div>
      ) : null}

      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-3xl font-bold tracking-tight text-app-text tabular-nums">
          {applied.toLocaleString()}
        </span>
        <span className="text-sm text-app-faint">/ {weeklyGoal} applications</span>
      </div>

      <div className="mt-4">
        <ProgressBar value={pct} color={complete ? 'bg-emerald-500' : 'bg-app-accent'} />
      </div>

      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="font-bold text-app-text tabular-nums">{pct}%</span>
        <span className="text-app-muted">
          {complete
            ? 'Excellent consistency!'
            : `${remaining} application${remaining === 1 ? '' : 's'} remaining`}
        </span>
      </div>
    </div>
  )
}

function DailyGoalCard({
  todayCount,
  dailyGoal,
  todayOk
}: {
  todayCount: number
  dailyGoal: number
  todayOk: boolean
}): React.ReactNode {
  const pct = Math.min(100, Math.round((todayCount / dailyGoal) * 100))
  return (
    <div className="rounded-2xl border border-app-border bg-app-card p-6 shadow-card">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-app-accent" />
        <h2 className="text-sm font-semibold text-app-text">Today's Goal</h2>
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-3xl font-bold tracking-tight text-app-text tabular-nums">
          {todayCount.toLocaleString()}
        </span>
        <span className="text-sm text-app-faint">/ {dailyGoal} today</span>
      </div>

      <div className="mt-4">
        <ProgressBar value={pct} color={todayOk ? 'bg-emerald-500' : 'bg-app-accent'} />
      </div>

      <p className="mt-3 text-sm text-app-muted">
        {todayOk
          ? '🎉 Daily goal complete — great work!'
          : `${Math.max(0, dailyGoal - todayCount)} more to reach today's goal.`}
      </p>
    </div>
  )
}

function WeeklyPerformance({
  history,
  currentApplied,
  weeklyGoal
}: {
  history: ReturnType<typeof computeWeeklyHistory>
  currentApplied: number
  weeklyGoal: number
}): React.ReactNode {
  const last = history[0]
  const lastWeekApplied = last?.applied ?? 0
  return (
    <div className="rounded-2xl border border-app-border bg-app-card p-6 shadow-card">
      <h2 className="text-sm font-semibold text-app-text">Weekly Performance</h2>
      <p className="mb-4 text-xs text-app-faint">Consistency check</p>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-xl bg-app-subtle p-3">
          <div className="text-xl font-bold text-app-text tabular-nums">{currentApplied}</div>
          <div className="mt-0.5 text-[11px] font-medium text-app-muted">This Week</div>
        </div>
        <div className="rounded-xl bg-app-subtle p-3">
          <div className="text-xl font-bold text-app-text tabular-nums">{lastWeekApplied}</div>
          <div className="mt-0.5 text-[11px] font-medium text-app-muted">Last Week</div>
        </div>
        <div className="rounded-xl bg-app-subtle p-3">
          <div className="text-xl font-bold text-app-accent tabular-nums">{weeklyGoal}</div>
          <div className="mt-0.5 text-[11px] font-medium text-app-muted">Goal</div>
        </div>
      </div>
    </div>
  )
}

function RateRow({ label, pct }: { label: string; pct: number }): React.ReactNode {
  return (
    <div className="flex items-center gap-2">
      <span className="w-20 text-app-muted">{label}</span>
      <div className="flex-1">
        <ProgressBar value={pct} color="bg-app-accent/70" />
      </div>
      <span className="w-10 text-right font-semibold text-app-text tabular-nums">
        {Math.round(pct)}%
      </span>
    </div>
  )
}

function RecentApplications({
  apps,
  onOpenDetails,
  onViewAll
}: {
  apps: Application[]
  onOpenDetails: (id: string) => void
  onViewAll: () => void
}): React.ReactNode {
  return (
    <div className="flex flex-col rounded-2xl border border-app-border bg-app-card p-6 shadow-card">
      <h2 className="text-sm font-semibold text-app-text">Recent Applications</h2>
      <p className="text-xs text-app-faint">Most recently added</p>

      <div className="mt-4 flex-1 space-y-1">
        {apps.length === 0 ? (
          <p className="py-6 text-center text-sm text-app-faint">Nothing tracked yet.</p>
        ) : (
          apps.map((app) => {
            const effective = withEffectiveStatus(app).effectiveStatus
            return (
              <button
                key={app.id}
                onClick={() => onOpenDetails(app.id)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-app-subtle"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-app-text">{app.companyName}</div>
                  <div className="truncate text-xs text-app-muted">{app.position}</div>
                </div>
                <div className="text-right">
                  <StatusBadge status={effective} size="sm" />
                  <div className="mt-1 text-[11px] text-app-faint">{formatRelative(app.createdAt)}</div>
                </div>
              </button>
            )
          })
        )}
      </div>

      <button
        onClick={onViewAll}
        className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-xl border border-app-border px-4 py-2 text-sm font-medium text-app-accent transition-colors hover:bg-app-accent-soft"
      >
        View All Applications <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  )
}