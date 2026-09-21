import type { ReactNode } from 'react'

export function EmptyState({
  icon,
  title,
  message,
  action
}: {
  icon: ReactNode
  title: string
  message: string
  action?: ReactNode
}): ReactNode {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-app-border-strong bg-app-subtle/50 px-6 py-14 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-app-card text-app-faint shadow-card">
        {icon}
      </div>
      <h3 className="mt-4 text-base font-semibold text-app-text">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-app-muted">{message}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}