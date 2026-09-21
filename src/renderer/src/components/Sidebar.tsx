import {
  BarChart3,
  LayoutDashboard,
  ListChecks,
  Settings,
  Briefcase
} from 'lucide-react'
import logoUrl from '../assets/logo.png'
import { APP_NAME } from '@shared/constants.ts'
import { useUiStore, type PageKey } from '../uiStore.ts'

const NAV: { key: PageKey; label: string; icon: typeof LayoutDashboard }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'track', label: 'Track Applications', icon: ListChecks },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'settings', label: 'Settings', icon: Settings }
]

export function Sidebar(): React.ReactNode {
  const page = useUiStore((s) => s.page)
  const setPage = useUiStore((s) => s.setPage)

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-app-border bg-app-card">
      <div className="flex items-center gap-3 px-5 pt-5 pb-4">
        <img src={logoUrl} alt="TrabahoTracker logo" className="h-8 w-8 rounded-lg object-contain" />
        <div className="leading-tight">
          <div className="text-sm font-bold tracking-tight text-app-text">{APP_NAME}</div>
          <div className="text-[11px] text-app-faint">Track. Stay consistent. Get hired.</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {NAV.map((item) => {
          const active = page === item.key
          const Icon = item.icon
          return (
            <button
              key={item.key}
              onClick={() => setPage(item.key)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? 'bg-app-accent-soft text-app-accent'
                  : 'text-app-muted hover:bg-app-subtle hover:text-app-text'
              }`}
            >
              <Icon className="h-4.5 w-4.5" />
              {item.label}
            </button>
          )
        })}
      </nav>

      <div className="border-t border-app-border px-5 py-4">
        <div className="flex items-center gap-2 text-xs text-app-faint">
          <Briefcase className="h-3.5 w-3.5" />
          <span>Works fully offline</span>
        </div>
      </div>
    </aside>
  )
}