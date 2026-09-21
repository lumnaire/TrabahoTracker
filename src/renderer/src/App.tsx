import { useEffect } from 'react'
import { useAppStore } from './store.ts'
import { useUiStore } from './uiStore.ts'
import { useIsDark } from './hooks/useIsDark.ts'
import { Sidebar } from './components/Sidebar.tsx'
import { ConfirmDialog } from './components/ConfirmDialog.tsx'
import { ToastHost } from './components/ToastHost.tsx'
import { Modals } from './components/Modals.tsx'
import { Welcome } from './pages/Welcome.tsx'
import { Dashboard } from './pages/Dashboard.tsx'
import { Track } from './pages/Track.tsx'
import { Analytics } from './pages/Analytics.tsx'
import { Settings } from './pages/Settings.tsx'

export default function App(): React.ReactNode {
  const loading = useAppStore((s) => s.loading)
  const onboarded = useAppStore((s) => s.settings?.onboarded ?? false)
  const page = useUiStore((s) => s.page)
  const init = useAppStore((s) => s.init)
  const setAppInfo = useUiStore((s) => s.setAppInfo)

  useIsDark()

  useEffect(() => {
    void init()
    void window.trabaho.app.info().then(setAppInfo).catch(() => {})
  }, [init, setAppInfo])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-app-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-app-border border-t-app-accent" />
          <p className="text-sm text-app-muted">Loading TrabahoTracker…</p>
        </div>
      </div>
    )
  }

  if (!onboarded) {
    return (
      <>
        <Welcome />
        <ConfirmDialog />
        <ToastHost />
        <Modals />
      </>
    )
  }

  return (
    <div className="flex h-full bg-app-bg text-app-text">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {page === 'dashboard' ? <Dashboard /> : null}
        {page === 'track' ? <Track /> : null}
        {page === 'analytics' ? <Analytics /> : null}
        {page === 'settings' ? <Settings /> : null}
      </main>
      <ConfirmDialog />
      <ToastHost />
      <Modals />
    </div>
  )
}