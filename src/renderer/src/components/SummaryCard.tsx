import { TrendingUp } from 'lucide-react'

export function SummaryCard({
  label,
  value
}: {
  label: string
  value: number
}): React.ReactNode {
  return (
    <div className="rounded-2xl border border-app-border bg-app-card p-5 shadow-card">
      <div className="flex items-center gap-2 text-app-faint">
        <TrendingUp className="h-4 w-4" />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className="mt-2 text-3xl font-bold tracking-tight text-app-text tabular-nums">
        {value.toLocaleString()}
      </div>
    </div>
  )
}