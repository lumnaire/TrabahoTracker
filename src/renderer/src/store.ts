import { create } from 'zustand'
import type {
  Application,
  ApplicationInput,
  ApplicationPatch,
  ApplicationStatus,
  ExportResult,
  ImportResult,
  StatusHistoryEntry,
  UserSettings
} from '@shared/types.ts'
import type { PickImportResult } from '@shared/ipc.ts'

interface AppStore {
  apps: Application[]
  settings: UserSettings | null
  historyById: Record<string, StatusHistoryEntry[]>
  loading: boolean
  error: string | null
  init: () => Promise<void>
  refresh: () => Promise<void>
  addApp: (input: ApplicationInput) => Promise<Application>
  updateApp: (id: string, patch: ApplicationPatch) => Promise<Application>
  removeApp: (id: string) => Promise<void>
  changeStatus: (id: string, status: ApplicationStatus, note?: string) => Promise<Application>
  loadHistory: (id: string) => Promise<StatusHistoryEntry[]>
  updateSettings: (patch: Partial<UserSettings>) => Promise<UserSettings>
  exportData: () => Promise<ExportResult>
  pickImport: () => Promise<PickImportResult>
  doImport: (token: string) => Promise<ImportResult>
  resetAll: () => Promise<void>
  loadSeed: () => Promise<number>
}

export const useAppStore = create<AppStore>((set, get) => ({
  apps: [],
  settings: null,
  historyById: {},
  loading: true,
  error: null,

  async init() {
    try {
      const [apps, settings] = await Promise.all([
        window.trabaho.apps.list(),
        window.trabaho.settings.get()
      ])
      set({ apps, settings, error: null })
    } catch (err) {
      set({ error: (err as Error).message })
    } finally {
      set({ loading: false })
    }
  },

  async refresh() {
    const apps = await window.trabaho.apps.list()
    set({ apps })
  },

  async addApp(input) {
    const app = await window.trabaho.apps.create(input)
    set({ apps: [app, ...get().apps] })
    return app
  },

  async updateApp(id, patch) {
    const updated = await window.trabaho.apps.update(id, patch)
    set({ apps: get().apps.map((a) => (a.id === id ? updated : a)) })
    return updated
  },

  async removeApp(id) {
    await window.trabaho.apps.remove(id)
    set({
      apps: get().apps.filter((a) => a.id !== id),
      historyById: { ...get().historyById, [id]: [] }
    })
  },

  async changeStatus(id, status, note) {
    const updated = await window.trabaho.apps.changeStatus(id, status, note)
    set({ apps: get().apps.map((a) => (a.id === id ? updated : a)) })
    return updated
  },

  async loadHistory(id) {
    const history = await window.trabaho.apps.history(id)
    set({ historyById: { ...get().historyById, [id]: history } })
    return history
  },

  async updateSettings(patch) {
    const settings = await window.trabaho.settings.update(patch)
    set({ settings })
    return settings
  },

  async exportData() {
    return window.trabaho.data.export()
  },

  async pickImport() {
    return window.trabaho.data.pickImport()
  },

  async doImport(token) {
    const result = await window.trabaho.data.doImport(token)
    await get().init()
    return result
  },

  async resetAll() {
    await window.trabaho.settings.resetAll()
    await get().init()
  },

  async loadSeed() {
    const { count } = await window.trabaho.seed.load()
    await get().init()
    return count
  }
}))