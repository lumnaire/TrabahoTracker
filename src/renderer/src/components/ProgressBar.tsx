export function ProgressBar({
  value,
  color = 'bg-app-accent'
}: {
  value: number
  color?: string
}): React.ReactNode {
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-app-subtle">
      <div
        className={`h-full rounded-full ${color} transition-all duration-500 ease-out`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}