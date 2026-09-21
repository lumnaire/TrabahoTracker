import { app, ipcMain } from 'electron'
import os from 'node:os'
import { IPC } from '@shared/ipc.ts'
import type {
  ApplicationInput,
  ApplicationPatch,
  ApplicationStatus,
  UserSettings
} from '@shared/types.ts'
import {
  changeStatus,
  createApplication,
  deleteApplication,
  getApplication,
  getStatusHistory,
  listApplications,
  updateApplication
} from '../services/applications.ts'
import {
  DEFAULT_SETTINGS,
  getSettings,
  updateSettings,
  validateSettingsPatch
} from '../services/settings.ts'
import { clearAllApplications } from '../services/applications.ts'
import { exportData, performImport, pickImportFile } from '../services/backup.ts'
import { showNotification } from '../services/notifications.ts'

export function registerIpcHandlers(): void {
  ipcMain.handle(IPC.appsList, () => listApplications())
  ipcMain.handle(IPC.appsGet, (_e, id: string) => getApplication(id))
  ipcMain.handle(IPC.appsCreate, (_e, input: ApplicationInput) => createApplication(input))
  ipcMain.handle(IPC.appsUpdate, (_e, id: string, patch: ApplicationPatch) =>
    updateApplication(id, patch)
  )
  ipcMain.handle(IPC.appsDelete, (_e, id: string) => deleteApplication(id))
  ipcMain.handle(IPC.appsChangeStatus, (_e, id: string, status: ApplicationStatus, note?: string) =>
    changeStatus(id, status, note ?? null)
  )
  ipcMain.handle(IPC.appsHistory, (_e, id: string) => getStatusHistory(id))

  ipcMain.handle(IPC.settingsGet, () => getSettings())
  ipcMain.handle(IPC.settingsUpdate, (_e, patch: Partial<UserSettings>) => {
    const next = updateSettings(validateSettingsPatch(patch))
    app.setLoginItemSettings({ openAtLogin: next.startOnLaunch })
    return next
  })
  ipcMain.handle(IPC.settingsReset, () => {
    clearAllApplications()
    app.setLoginItemSettings({ openAtLogin: false })
    return updateSettings({ ...DEFAULT_SETTINGS })
  })

  ipcMain.handle(IPC.dataExport, () => exportData())
  ipcMain.handle(IPC.dataPickImport, () => pickImportFile())
  ipcMain.handle(IPC.dataDoImport, (_e, token: string) => performImport(token))

  // Dev-only sample data — never available in packaged builds.
  ipcMain.handle(IPC.seedLoad, async () => {
    if (app.isPackaged && process.env.NODE_ENV !== 'development') {
      throw new Error('Sample data is only available in development builds.')
    }
    const { seedData } = await import('../services/seed.ts')
    return seedData()
  })

  ipcMain.handle(IPC.notifyShow, (_e, title: string, body: string) => {
    showNotification(String(title), String(body))
  })

  ipcMain.handle(IPC.appInfo, () => ({
    userName: os.userInfo().username,
    version: app.getVersion(),
    isDev: !app.isPackaged
  }))
}