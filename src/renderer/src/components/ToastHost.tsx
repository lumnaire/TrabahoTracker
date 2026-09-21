import { CheckCircle2, Info, XCircle } from 'lucide-react'
import { useToastStore } from '../toasts.ts'

const STYLES = {
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  error: 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400',
  info: 'border-app-accent/30 bg-app-accent-soft text-app-accent'
}

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  info: Info
}

export function ToastHost(): React.ReactNode {
  const toasts = useToastStore((s) => s.toasts)
  const dismiss = useToastStore((s) => s.dismiss)

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[70] flex flex-col gap-2">
      {toasts.map((t) => {
        const Icon = ICONS[t.type]
        return (
          <button
            key={t.id}
            onClick={() => dismiss(t.id)}
            className={`pointer-events-auto flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium shadow-card backdrop-blur animate-toast ${STYLES[t.type]}`}
          >
            <Icon className="h-4.5 w-4.5 shrink-0" />
            <span>{t.message}</span>
          </button>
        )
      })}
    </div>
  )
}