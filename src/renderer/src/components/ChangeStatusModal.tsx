import { useState } from 'react'
import { Info } from 'lucide-react'
import { STATUS_ORDER, STATUS_LABELS } from '@shared/status.ts'
import { NO_RESPONSE_DAYS } from '@shared/constants.ts'
import type { ApplicationStatus } from '@shared/types.ts'
import { Modal } from './Modal.tsx'
import { StatusBadge } from './StatusBadge.tsx'
import { useAppStore } from '../store.ts'
import { useUiStore } from '../uiStore.ts'
import { toast } from '../toasts.ts'

export function ChangeStatusModal({ appId }: { appId: string }): React.ReactNode {
  const app = useAppStore((s) => s.apps.find((a) => a.id === appId))
  const changeStatus = useAppStore((s) => s.changeStatus)
  const setModal = useUiStore((s) => s.setModal)
  const [selected, setSelected] = useState<ApplicationStatus | null>(app?.status ?? null)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  if (!app) return null

  const submit = async (): Promise<void> => {
    if (!selected) return
    setBusy(true)
    try {
      await changeStatus(appId, selected, note.trim() || undefined)
      toast('success', `Status changed to ${STATUS_LABELS[selected]}.`)
      setModal({ kind: 'none' })
    } catch (err) {
      toast('error', (err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open
      onClose={() => setModal({ kind: 'none' })}
      title="Change Status"
      subtitle={`${app.companyName} — ${app.position}`}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {STATUS_ORDER.map((status) => {
            const active = selected === status
            return (
              <button
                key={status}
                onClick={() => setSelected(status)}
                className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                  active
                    ? 'border-app-accent bg-app-accent-soft text-app-text'
                    : 'border-app-border bg-app-subtle/40 text-app-muted hover:bg-app-subtle'
                }`}
              >
                <StatusBadge status={status} />
              </button>
            )
          })}
        </div>

        {selected === 'pending' ? (
          <div className="flex items-start gap-2 rounded-xl bg-app-accent-soft px-4 py-3 text-sm text-app-accent">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Setting this back to Pending restarts the {NO_RESPONSE_DAYS}-day No Response
              timer.
            </span>
          </div>
        ) : null}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-app-text">
            Note <span className="font-normal text-app-faint">(optional)</span>
          </label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Recruiter reached out for a phone screen"
            className="w-full rounded-xl border border-app-border bg-app-subtle/60 px-3.5 py-2.5 text-sm text-app-text placeholder:text-app-faint outline-none transition-colors focus:border-app-accent focus:ring-2 focus:ring-app-accent/25"
          />
        </div>

        <div className="flex justify-end gap-3 border-t border-app-border pt-4">
          <button
            onClick={() => setModal({ kind: 'none' })}
            disabled={busy}
            className="rounded-xl border border-app-border px-4 py-2 text-sm font-medium text-app-muted transition-colors hover:bg-app-subtle hover:text-app-text"
          >
            Cancel
          </button>
          <button
            onClick={() => void submit()}
            disabled={busy || selected === app.status}
            className="rounded-xl bg-app-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-app-accent-hover disabled:opacity-50"
          >
            Update Status
          </button>
        </div>
      </div>
    </Modal>
  )
}