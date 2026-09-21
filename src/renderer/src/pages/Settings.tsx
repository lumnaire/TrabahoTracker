import { useState } from 'react'
import type { ChangeEvent } from 'react'
import {
  Bell,
  Database,
  Download,
  Import,
  Moon,
  Palmtree,
  Power,
  RefreshCw,
  Settings2,
  Sun,
  Trash2,
  Target,
  Monitor
} from 'lucide-react'
import { APP_NAME } from '@shared/constants.ts'
import type { ThemePreference } from '@shared/types.ts'
import { useAppStore } from '../store.ts'
import { useUiStore } from '../uiStore.ts'
import { toast } from '../toasts.ts'

export function Settings(): React.ReactNode {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-8 py-8">
      <header>
        <h1 className="text-xl font-bold tracking-tight text-app-text">Settings</h1>
        <p className="mt-0.5 text-sm text-app-muted">
          Tune TrabahoTracker to fit your job search.
        </p>
      </header>

      <GeneralSection />
      <GoalsSection />
      <NotificationsSection />
      <DataSection />
      <AboutSection />
    </div>
  )
}

function Card({ icon, title, subtitle, children }: { icon: React.ReactNode; title: string; subtitle: string; children: React.ReactNode }): React.ReactNode {
  return (
    <section className="rounded-2xl border border-app-border bg-app-card p-6 shadow-card">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-app-accent-soft text-app-accent">
          {icon}
        </div>
        <div>
          <h2 className="text-sm font-semibold text-app-text">{title}</h2>
          <p className="text-xs text-app-faint">{subtitle}</p>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

const inputClass =
  'rounded-xl border border-app-border bg-app-subtle/60 px-3.5 py-2.5 text-sm text-app-text outline-none transition-colors focus:border-app-accent focus:ring-2 focus:ring-app-accent/25'

function GeneralSection(): React.ReactNode {
  const settings = useAppStore((s) => s.settings)!
  const updateSettings = useAppStore((s) => s.updateSettings)
  const isDev = useUiStore((s) => s.appInfo?.isDev ?? false)

  const setName = (name: string): void => {
    void updateSettings({ name })
  }

  const setTheme = (theme: ThemePreference): void => {
    void updateSettings({ theme })
  }

  const setLaunch = (value: boolean): void => {
    void updateSettings({ startOnLaunch: value })
  }

  const themeOptions: { key: ThemePreference; label: string; icon: React.ReactNode }[] = [
    { key: 'system', label: 'System', icon: <Monitor className="h-4 w-4" /> },
    { key: 'light', label: 'Light', icon: <Sun className="h-4 w-4" /> },
    { key: 'dark', label: 'Dark', icon: <Moon className="h-4 w-4" /> }
  ]

  return (
    <Card icon={<Settings2 className="h-4.5 w-4.5" />} title="General" subtitle="App preferences">
      <div className="space-y-2">
        <label className="text-sm font-medium text-app-text">Display name</label>
        <input
          className={`${inputClass} w-full`}
          value={settings.name}
          onChange={(e) => setName(e.target.value)}
          placeholder="What should we call you?"
        />
        <p className="text-xs text-app-faint">Used in the Dashboard greeting.</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-app-text">Theme</label>
        <div className="flex gap-2">
          {themeOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setTheme(opt.key)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
                settings.theme === opt.key
                  ? 'border-app-accent bg-app-accent-soft text-app-accent'
                  : 'border-app-border text-app-muted hover:bg-app-subtle'
              }`}
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-app-border bg-app-subtle/40 px-4 py-3">
        <div className="flex items-center gap-3">
          <Power className="h-4 w-4 text-app-faint" />
          <div>
            <div className="text-sm font-medium text-app-text">Start on system startup</div>
            <div className="text-xs text-app-faint">Launch TrabahoTracker when you sign in</div>
          </div>
        </div>
        <Toggle on={settings.startOnLaunch} onChange={setLaunch} />
      </div>

      {isDev ? (
        <div className="rounded-xl border border-dashed border-app-border-strong bg-app-subtle/40 px-4 py-3">
          <div className="mb-2 text-sm font-medium text-app-text">Developer data</div>
          <p className="mb-3 text-xs text-app-faint">
            Load 20 realistic sample applications to explore every feature. Replaces current
            data.
          </p>
          <LoadSeedButton />
        </div>
      ) : null}
    </Card>
  )
}

function LoadSeedButton(): React.ReactNode {
  const [busy, setBusy] = useState(false)
  const loadSeed = useAppStore((s) => s.loadSeed)
  const ask = useUiStore((s) => s.ask)

  const onClick = async (): Promise<void> => {
    const ok = await ask({
      title: 'Load sample data?',
      message: 'This replaces your current applications with 20 sample applications.',
      confirmLabel: 'Load Sample Data',
      destructive: false
    })
    if (!ok) return
    setBusy(true)
    try {
      const count = await loadSeed()
      toast('success', `Loaded ${count} sample applications.`)
    } catch (err) {
      toast('error', (err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      onClick={() => void onClick()}
      disabled={busy}
      className="rounded-xl border border-app-border px-4 py-2 text-sm font-medium text-app-muted transition-colors hover:bg-app-subtle hover:text-app-text disabled:opacity-60"
    >
      {busy ? 'Loading…' : 'Load sample data'}
    </button>
  )
}

function GoalsSection(): React.ReactNode {
  const settings = useAppStore((s) => s.settings)!
  const updateSettings = useAppStore((s) => s.updateSettings)

  const setDaily = (e: ChangeEvent<HTMLInputElement>): void => {
    const value = parseInt(e.target.value, 10)
    if (Number.isFinite(value) && value >= 1) {
      void updateSettings({ dailyGoal: value })
    }
  }
  const setWeekly = (e: ChangeEvent<HTMLInputElement>): void => {
    const value = parseInt(e.target.value, 10)
    if (Number.isFinite(value) && value >= 1) {
      void updateSettings({ weeklyGoal: value })
    }
  }

  return (
    <Card icon={<Target className="h-4.5 w-4.5" />} title="Daily & Weekly Goals" subtitle="Defaults: 10/day · 50/week">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-app-text">
            Daily goal <span className="text-app-faint">(weekdays)</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              className={`${inputClass} w-28`}
              value={settings.dailyGoal}
              onChange={setDaily}
            />
            <span className="text-sm text-app-muted">applications/day</span>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-app-text">Weekly goal</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              className={`${inputClass} w-28`}
              value={settings.weeklyGoal}
              onChange={setWeekly}
            />
            <span className="text-sm text-app-muted">applications/week</span>
          </div>
        </div>
      </div>
      <p className="text-xs text-app-faint">
        Weekends don't count toward the daily target, but weekend applications still count in
        your totals and weekly goal. Weekly stats never get deleted — Analytics keeps your
        history.
      </p>
    </Card>
  )
}

function NotificationsSection(): React.ReactNode {
  const settings = useAppStore((s) => s.settings)!
  const updateSettings = useAppStore((s) => s.updateSettings)

  return (
    <Card icon={<Bell className="h-4.5 w-4.5" />} title="Notifications" subtitle="Desktop reminders, at most once per day">
      <SettingRow
        title="Daily goal reminder"
        subtitle="Nudge you when you're below today's target"
        on={settings.notifyDailyGoal}
        onChange={(v) => void updateSettings({ notifyDailyGoal: v })}
      />
      <SettingRow
        title="Weekly goal reminder"
        subtitle="Remind you how many are left this week"
        on={settings.notifyWeeklyGoal}
        onChange={(v) => void updateSettings({ notifyWeeklyGoal: v })}
      />
      <SettingRow
        title="No Response reminder"
        subtitle="Flag applications with no reply after 7 days"
        on={settings.notifyNoResponse}
        onChange={(v) => void updateSettings({ notifyNoResponse: v })}
      />
    </Card>
  )
}

function SettingRow({
  title,
  subtitle,
  on,
  onChange
}: {
  title: string
  subtitle: string
  on: boolean
  onChange: (value: boolean) => void
}): React.ReactNode {
  return (
    <div className="flex items-center justify-between rounded-xl border border-app-border bg-app-subtle/40 px-4 py-3">
      <div>
        <div className="text-sm font-medium text-app-text">{title}</div>
        <div className="text-xs text-app-faint">{subtitle}</div>
      </div>
      <Toggle on={on} onChange={onChange} />
    </div>
  )
}

function Toggle({ on, onChange }: { on: boolean; onChange: (value: boolean) => void }): React.ReactNode {
  return (
    <button
      onClick={() => onChange(!on)}
      role="switch"
      aria-checked={on}
      className={`relative h-6 w-11 rounded-full transition-colors ${on ? 'bg-app-accent' : 'bg-app-border-strong'}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? 'left-[22px]' : 'left-0.5'}`}
      />
    </button>
  )
}

function DataSection(): React.ReactNode {
  const exportData = useAppStore((s) => s.exportData)
  const pickImport = useAppStore((s) => s.pickImport)
  const resetAll = useAppStore((s) => s.resetAll)
  const setImportPreview = useUiStore((s) => s.setImportPreview)
  const ask = useUiStore((s) => s.ask)
  const [exportBusy, setExportBusy] = useState(false)
  const [importBusy, setImportBusy] = useState(false)

  const onExport = async (): Promise<void> => {
    setExportBusy(true)
    try {
      const result = await exportData()
      if (result.canceled) return
      if (result.error) {
        toast('error', `Export failed: ${result.error}`)
      } else {
        toast('success', `Backup saved to ${result.filePath ?? 'file'}.`)
      }
    } catch (err) {
      toast('error', (err as Error).message)
    } finally {
      setExportBusy(false)
    }
  }

  const onImport = async (): Promise<void> => {
    setImportBusy(true)
    try {
      const result = await pickImport()
      if (result.canceled) return
      setImportPreview({
        token: result.preview.token,
        exportedAt: result.preview.exportedAt,
        applications: result.preview.applications,
        history: result.preview.history
      })
    } catch (err) {
      toast('error', (err as Error).message)
    } finally {
      setImportBusy(false)
    }
  }

  const onReset = async (): Promise<void> => {
    const ok = await ask({
      title: 'Reset All Data?',
      message: 'Permanently delete every application, status history, and restore all settings.',
      confirmLabel: 'Reset Everything',
      destructive: true
    })
    if (!ok) return
    try {
      await resetAll()
      toast('success', 'All data has been reset.')
    } catch (err) {
      toast('error', (err as Error).message)
    }
  }

  return (
    <Card icon={<Database className="h-4.5 w-4.5" />} title="Data" subtitle="Backups, restores & safety">
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => void onExport()}
          disabled={exportBusy}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-app-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-app-accent-hover disabled:opacity-60"
        >
          <Download className="h-4 w-4" />
          {exportBusy ? 'Exporting…' : 'Export Backup'}
        </button>
        <button
          onClick={() => void onImport()}
          disabled={importBusy}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-app-border px-4 py-2.5 text-sm font-semibold text-app-muted transition-colors hover:bg-app-subtle hover:text-app-text disabled:opacity-60"
        >
          <Import className="h-4 w-4" />
          {importBusy ? 'Reading…' : 'Import Backup'}
        </button>
      </div>
      <div className="flex items-center justify-between rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
        <div>
          <div className="text-sm font-medium text-app-text">Reset All Data</div>
          <div className="text-xs text-app-faint">
            Deletes everything. Export a backup first if you're unsure.
          </div>
        </div>
        <button
          onClick={() => void onReset()}
          className="inline-flex items-center gap-2 rounded-xl bg-red-500/10 px-3.5 py-2 text-sm font-semibold text-app-danger transition-colors hover:bg-red-500/20"
        >
          <Trash2 className="h-4 w-4" /> Reset
        </button>
      </div>
    </Card>
  )
}

function AboutSection(): React.ReactNode {
  const version = useUiStore((s) => s.appInfo?.version ?? '1.0.0')
  return (
    <Card icon={<Palmtree className="h-4.5 w-4.5" />} title="About" subtitle={`${APP_NAME} v${version}`}>
      <div className="flex items-center gap-3 rounded-xl border border-app-border bg-app-subtle/40 px-4 py-3">
        <RefreshCw className="h-4 w-4 text-app-faint" />
        <p className="text-xs leading-relaxed text-app-muted">
          {APP_NAME} is a fully offline job application tracker. Your data lives only on this
          computer — no accounts, no cloud, no tracking. Export backups regularly to keep your
          history safe.
        </p>
      </div>
    </Card>
  )
}