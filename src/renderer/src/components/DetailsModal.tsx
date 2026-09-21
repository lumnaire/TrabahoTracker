import { useEffect } from 'react'
import {
  Building2,
  CalendarDays,
  Globe,
  Mail,
  MapPin,
  Pencil,
  RefreshCw,
  Trash2,
  Coins,
  User
} from 'lucide-react'
import { formatLongDate, formatRelative } from '@shared/dates.ts'
import { getEffectiveStatus } from '@shared/status.ts'
import { STATUS_LABELS } from '@shared/status.ts'
import { Modal } from './Modal.tsx'
import { StatusBadge } from './StatusBadge.tsx'
import { useAppStore } from '../store.ts'
import { useUiStore } from '../uiStore.ts'

const inputClass =
  'w-full rounded-xl border border-app-border bg-app-subtle/50 px-3.5 py-2.5 text-sm text-app-text'

export function DetailsModal({ appId }: { appId: string }): React.ReactNode {
  const app = useAppStore((s) => s.apps.find((a) => a.id === appId))
  const history = useAppStore((s) => s.historyById[appId] ?? [])
  const loadHistory = useAppStore((s) => s.loadHistory)
  const setModal = useUiStore((s) => s.setModal)

  useEffect(() => {
    if (app) void loadHistory(app.id).catch(() => {})
  }, [app, loadHistory])

  if (!app) return null

  const effective = getEffectiveStatus(app.status, app.lastUpdated)

  const detailRow = (
    key: string,
    value: string | null,
    icon: React.ReactNode
  ): React.ReactNode => (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-app-subtle text-app-faint">
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-xs font-medium uppercase tracking-wide text-app-faint">{key}</div>
        <div className="mt-0.5 text-sm text-app-text">{value || '—'}</div>
      </div>
    </div>
  )

  return (
    <Modal
      open
      onClose={() => setModal({ kind: 'none' })}
      title={app.companyName}
      subtitle={app.position}
      width="max-w-2xl"
    >
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <StatusBadge status={effective} />
          <span className="text-xs text-app-faint">
            Applied {formatRelative(app.createdAt)}
          </span>
        </div>

        {app.notes ? (
          <div className="rounded-xl border border-app-border bg-app-subtle/40 px-4 py-3 text-sm leading-relaxed text-app-muted">
            {app.notes}
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          {detailRow('Company Email', app.companyEmail, <Mail className="h-4 w-4" />)}
          {detailRow('Date Applied', formatLongDate(app.dateApplied), <CalendarDays className="h-4 w-4" />)}
          {detailRow('Last Updated', formatRelative(app.lastUpdated), <RefreshCw className="h-4 w-4" />)}
          {detailRow('Job Source', app.jobSource, <Building2 className="h-4 w-4" />)}
          {detailRow('Location', app.location, <MapPin className="h-4 w-4" />)}
          {detailRow('Salary', app.salary, <Coins className="h-4 w-4" />)}
          {detailRow('Contact Person', app.contactPerson, <User className="h-4 w-4" />)}
          {detailRow(
            'Job URL',
            app.jobUrl,
            <Globe className="h-4 w-4" />
          )}
        </div>

        {app.jobUrl ? (
          <input readOnly className={inputClass} value={app.jobUrl} />
        ) : null}

        <div>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-app-faint">
            Status History
          </h4>
          {history.length === 0 ? (
            <p className="text-sm text-app-faint">No status changes recorded.</p>
          ) : (
            <ol className="relative ml-2 space-y-4 border-l border-app-border pl-5">
              {[...history].reverse().map((entry) => (
                <li key={entry.id} className="relative">
                  <span className="absolute -left-[27px] top-1.5 h-2.5 w-2.5 rounded-full border border-app-border bg-app-accent" />
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-app-text">
                      {STATUS_LABELS[entry.newStatus]}
                    </span>
                    <span className="text-xs text-app-faint">{formatRelative(entry.changedAt)}</span>
                  </div>
                  {entry.note ? (
                    <p className="mt-0.5 text-sm text-app-muted">{entry.note}</p>
                  ) : null}
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t border-app-border pt-4">
          <button
            onClick={() => setModal({ kind: 'status', id: app.id })}
            className="inline-flex items-center gap-2 rounded-xl border border-app-border px-4 py-2 text-sm font-medium text-app-muted transition-colors hover:bg-app-subtle hover:text-app-text"
          >
            <RefreshCw className="h-4 w-4" /> Change Status
          </button>
          <button
            onClick={() => setModal({ kind: 'edit', id: app.id })}
            className="inline-flex items-center gap-2 rounded-xl border border-app-border px-4 py-2 text-sm font-medium text-app-muted transition-colors hover:bg-app-subtle hover:text-app-text"
          >
            <Pencil className="h-4 w-4" /> Edit
          </button>
          <ConfirmDeleteButton appId={app.id} />
        </div>
      </div>
    </Modal>
  )
}

function ConfirmDeleteButton({ appId }: { appId: string }): React.ReactNode {
  const app = useAppStore((s) => s.apps.find((a) => a.id === appId))
  const removeApp = useAppStore((s) => s.removeApp)
  const ask = useUiStore((s) => s.ask)
  const setModal = useUiStore((s) => s.setModal)

  if (!app) return null

  const onDelete = async (): Promise<void> => {
    const ok = await ask({
      title: 'Delete Application?',
      message: 'This action cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true,
      details: [
        { label: 'Company', value: app.companyName },
        { label: 'Position', value: app.position }
      ]
    })
    if (!ok) return
    try {
      await removeApp(appId)
      setModal({ kind: 'none' })
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <button
      onClick={() => void onDelete()}
      className="inline-flex items-center gap-2 rounded-xl bg-red-500/10 px-4 py-2 text-sm font-semibold text-app-danger transition-colors hover:bg-red-500/20"
    >
      <Trash2 className="h-4 w-4" /> Delete
    </button>
  )
}