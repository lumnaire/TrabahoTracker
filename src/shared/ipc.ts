import type {
  Application,
  ApplicationInput,
  ApplicationPatch,
  ApplicationStatus,
  ExportResult,
  ImportResult,
  StatusHistoryEntry,
  UserSettings
} from './types.ts'

export const IPC = {
  appsList: 'apps:list',
  appsGet: 'apps:get',
  appsCreate: 'apps:create',
  appsUpdate: 'apps:update',
  appsDelete: 'apps:delete',
  appsChangeStatus: 'apps:changeStatus',
  appsHistory: 'apps:history',
  settingsGet: 'settings:get',
  settingsUpdate: 'settings:update',
  settingsReset: 'settings:resetAll',
  dataExport: 'data:export',
  dataPickImport: 'data:pickImport',
  dataDoImport: 'data:doImport',
  seedLoad: 'seed:load',
  notifyShow: 'notify:show',
  appInfo: 'app:info'
} as const

export interface AppInfo {
  userName: string
  version: string
  isDev: boolean
}

export interface ImportPreview {
  token: string
  exportedAt: string
  applications: number
  history: number
}

export type PickImportResult = { canceled: true } | { canceled: false; preview: ImportPreview }

/** The only surface exposed to the renderer via the preload bridge. */
export interface TrabahoApi {
  apps: {
    list(): Promise<Application[]>
    get(id: string): Promise<Application | null>
    create(input: ApplicationInput): Promise<Application>
    update(id: string, patch: ApplicationPatch): Promise<Application>
    remove(id: string): Promise<void>
    changeStatus(id: string, status: ApplicationStatus, note?: string): Promise<Application>
    history(id: string): Promise<StatusHistoryEntry[]>
  }
  settings: {
    get(): Promise<UserSettings>
    update(patch: Partial<UserSettings>): Promise<UserSettings>
    resetAll(): Promise<void>
  }
  data: {
    export(): Promise<ExportResult>
    pickImport(): Promise<PickImportResult>
    doImport(token: string): Promise<ImportResult>
  }
  seed: {
    load(): Promise<{ count: number }>
  }
  notifications: {
    show(title: string, body: string): Promise<void>
  }
  app: {
    info(): Promise<AppInfo>
  }
}