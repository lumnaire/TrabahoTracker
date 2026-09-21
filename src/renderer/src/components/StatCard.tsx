import type { LucideIcon } from 'lucide-react'
import { ArrowUpRight } from 'lucide-react'

export function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  onClick
}: {
  label: string
  value: number
  icon: LucideIcon
  accent: string
  onClick?: () => void
}): React.ReactNode {
  return (
    <button
      onClick={onClick}
      className={`group flex items-center gap-4 rounded-2xl border border-app-border bg-app-card p-4 text-left shadow-card transition-all ${onClick ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-lg' : 'cursor-default'}`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accent}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-bold leading-none text-app-text tabular-nums">
          {value.toLocaleString()}
        </div>
        <div className="mt-1 truncate text-xs font-medium text-app-muted">{label}</div>
      </div>
      {onClick ? (
        <ArrowUpRight className="ml-auto h-4 w-4 text-app-faint opacity-0 transition-opacity group-hover:opacity-100" />
      ) : null}
    </button>
  )
}