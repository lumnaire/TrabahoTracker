import type { ComponentType, ReactNode } from 'react'
import { Clock, Circle, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { STATUS_LABELS } from '@shared/status.ts'
import type { ApplicationStatus } from '@shared/types.ts'

const ICONS: Record<ApplicationStatus, ComponentType<{ className?: string }>> = {
  pending: Clock,
  no_response: Circle,
  processing: Loader2,
  approved: CheckCircle2,
  rejected: XCircle
}

const CONTAINER: Record<ApplicationStatus, string> = {
  pending: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  no_response: 'bg-slate-500/10 text-slate-500 dark:text-slate-400',
  processing: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  approved: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  rejected: 'bg-red-500/10 text-red-600 dark:text-red-400'
}

export function StatusBadge({
  status,
  size = 'md'
}: {
  status: ApplicationStatus
  size?: 'sm' | 'md'
}): ReactNode {
  const Icon = ICONS[status]
  const iconClass = size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'
  const pad = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${CONTAINER[status]} ${pad} whitespace-nowrap`}
    >
      <Icon className={`${iconClass} ${status === 'processing' ? 'animate-spin' : ''}`} />
      {STATUS_LABELS[status]}
    </span>
  )
}