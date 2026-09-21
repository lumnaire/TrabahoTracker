import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import type { StatusCounts } from '@shared/types.ts'
import { STATUS_LABELS, STATUS_ORDER } from '@shared/status.ts'

export const STATUS_COLORS = {
  pending: { light: '#d97706', dark: '#fbbf24' },
  no_response: { light: '#94a3b8', dark: '#94a3b8' },
  processing: { light: '#2563eb', dark: '#60a5fa' },
  approved: { light: '#16a34a', dark: '#34d399' },
  rejected: { light: '#dc2626', dark: '#f87171' }
}

interface TooltipItem {
  name?: string
  value?: number | string
  payload?: Record<string, unknown>
}

export function ChartTooltip({
  active,
  payload,
  label,
  valueSuffix = ''
}: {
  active?: boolean
  payload?: TooltipItem[]
  label?: string | number
  valueSuffix?: string
}): React.ReactNode {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="rounded-xl border border-app-border bg-app-card px-3 py-2 text-xs shadow-lg">
      {label !== undefined ? (
        <div className="mb-1 font-semibold text-app-text">{label}</div>
      ) : null}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-app-muted">
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: String(p.payload?.fill ?? p.payload?.color ?? '#888') }}
          />
          <span>{p.name}</span>
          <span className="ml-auto pl-3 font-semibold text-app-text tabular-nums">
            {p.value}
            {valueSuffix}
          </span>
        </div>
      ))}
    </div>
  )
}

export function ActivityBarChart({
  data,
  isDark
}: {
  data: { label: string; key: string; count: number }[]
  isDark: boolean
}): React.ReactNode {
  const tickColor = isDark ? '#7f8ba0' : '#5d6b82'
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }} barCategoryGap="28%">
        <XAxis
          dataKey="label"
          tick={{ fill: tickColor, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          interval={2}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fill: tickColor, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }} content={<ChartTooltip />} />
        <Bar dataKey="count" radius={[5, 5, 5, 5]}>
          {data.map((d) => (
            <Cell key={d.key} fill={d.count > 0 ? (isDark ? '#7c7cea' : '#5b5bd6') : 'transparent'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function StatusDonut({
  counts,
  isDark
}: {
  counts: StatusCounts
  isDark: boolean
}): React.ReactNode {
  const data = STATUS_ORDER.map((status) => ({
    name: STATUS_LABELS[status],
    value: counts[statusKey(status)],
    color: STATUS_COLORS[status][isDark ? 'dark' : 'light']
  })).filter((d) => d.value > 0)

  if (counts.total === 0 || data.length === 0) {
    return (
      <div className="flex h-[220px] items-center justify-center text-sm text-app-faint">
        No data yet
      </div>
    )
  }

  return (
    <div className="flex items-center gap-6">
      <div className="relative h-[200px] w-[200px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={62}
              outerRadius={88}
              paddingAngle={2}
              strokeWidth={0}
            >
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-app-text tabular-nums">{counts.total}</span>
          <span className="text-[11px] text-app-faint">total</span>
        </div>
      </div>
      <ul className="min-w-0 space-y-1.5">
        {STATUS_ORDER.map((status) => (
          <li key={status} className="flex items-center gap-2 text-sm">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: STATUS_COLORS[status][isDark ? 'dark' : 'light'] }}
            />
            <span className="text-app-muted">{STATUS_LABELS[status]}</span>
            <span className="ml-auto pl-3 font-semibold text-app-text tabular-nums">
              {counts.total > 0 ? Math.round((counts[statusKey(status)] / counts.total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function statusKey(
  status: (typeof STATUS_ORDER)[number]
): keyof StatusCounts {
  switch (status) {
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