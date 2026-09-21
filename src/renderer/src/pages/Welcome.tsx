import logoUrl from '../assets/logo.png'
import { APP_NAME, TAGLINE } from '@shared/constants.ts'
import { useAppStore } from '../store.ts'
import { useUiStore } from '../uiStore.ts'

export function Welcome(): React.ReactNode {
  const updateSettings = useAppStore((s) => s.updateSettings)
  const setPage = useUiStore((s) => s.setPage)

  const getStarted = async (): Promise<void> => {
    await updateSettings({ onboarded: true })
    setPage('dashboard')
  }

  return (
    <div className="flex h-full items-center justify-center bg-app-bg p-8">
      <div className="w-full max-w-md rounded-3xl border border-app-border bg-app-card p-10 text-center shadow-card animate-fade">
        <img
          src={logoUrl}
          alt="TrabahoTracker logo"
          className="mx-auto h-20 w-20 rounded-2xl object-contain"
        />
        <h1 className="mt-6 text-2xl font-bold tracking-tight text-app-text">
          Welcome to {APP_NAME}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-app-muted">
          Your personal offline job application tracker.
        </p>
        <p className="mt-5 text-sm font-medium text-app-text">{TAGLINE}</p>

        <div className="mt-6 flex flex-col gap-3 rounded-2xl bg-app-subtle px-5 py-4 text-left text-sm text-app-muted">
          <div className="flex items-center gap-3">
            <span className="text-app-accent">•</span>
            Track every application you send
          </div>
          <div className="flex items-center gap-3">
            <span className="text-app-accent">•</span>
            Stay consistent with daily &amp; weekly goals
          </div>
          <div className="flex items-center gap-3">
            <span className="text-app-accent">•</span>
            Keep moving forward
          </div>
        </div>

        <button
          onClick={() => void getStarted()}
          className="mt-8 w-full rounded-xl bg-app-accent px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-app-accent-hover"
        >
          Get Started
        </button>
        <p className="mt-4 text-[11px] text-app-faint">
          No account needed. Everything stays on your device.
        </p>
      </div>
    </div>
  )
}