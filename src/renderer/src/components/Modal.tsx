import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { useEffect } from 'react'

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  width = 'max-w-lg'
}: {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: ReactNode
  width?: string
}): ReactNode {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative w-full ${width} max-h-[90vh] overflow-y-auto rounded-2xl border border-app-border bg-app-card shadow-2xl animate-fade`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-app-border px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-app-text">{title}</h2>
            {subtitle ? <p className="mt-0.5 text-sm text-app-muted">{subtitle}</p> : null}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-app-faint transition-colors hover:bg-app-subtle hover:text-app-text"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}