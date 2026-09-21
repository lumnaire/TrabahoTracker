import { AlertTriangle } from 'lucide-react'
import { useUiStore } from '../uiStore.ts'

export function ConfirmDialog(): React.ReactNode {
  const confirm = useUiStore((s) => s.confirm)
  const settle = useUiStore((s) => s.settle)

  if (!confirm) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]"
        onClick={() => settle(false)}
        aria-hidden
      />
      <div
        role="alertdialog"
        aria-modal="true"
        className="relative w-full max-w-md rounded-2xl border border-app-border bg-app-card p-6 shadow-2xl animate-fade"
      >
        <div className="flex items-start gap-4">
          {confirm.destructive ? (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-app-danger">
              <AlertTriangle className="h-5 w-5" />
            </div>
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-app-accent-soft text-app-accent">
              <AlertTriangle className="h-5 w-5" />
            </div>
          )}
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-app-text">{confirm.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-app-muted">{confirm.message}</p>
            {confirm.details ? (
              <div className="mt-3 rounded-xl border border-app-border bg-app-subtle px-4 py-3">
                {confirm.details.map((d) => (
                  <div
                    key={d.label}
                    className="flex items-center justify-between gap-3 py-0.5 text-sm"
                  >
                    <span className="text-app-faint">{d.label}</span>
                    <span className="truncate font-medium text-app-text">{d.value}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => settle(false)}
            className="rounded-xl border border-app-border bg-transparent px-4 py-2 text-sm font-medium text-app-muted transition-colors hover:bg-app-subtle hover:text-app-text"
          >
            {confirm.cancelLabel ?? 'Cancel'}
          </button>
          <button
            onClick={() => settle(true)}
            autoFocus
            className={
              confirm.destructive
                ? 'rounded-xl bg-app-danger px-4 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90'
                : 'rounded-xl bg-app-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-app-accent-hover'
            }
          >
            {confirm.confirmLabel ?? 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}