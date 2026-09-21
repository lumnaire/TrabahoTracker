import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '@shared/ipc.ts'
import type { TrabahoApi } from '@shared/ipc.ts'

const api: TrabahoApi = {
  apps: {
    list: () => ipcRenderer.invoke(IPC.appsList),
    get: (id) => ipcRenderer.invoke(IPC.appsGet, id),
    create: (input) => ipcRenderer.invoke(IPC.appsCreate, input),
    update: (id, patch) => ipcRenderer.invoke(IPC.appsUpdate, id, patch),
    remove: (id) => ipcRenderer.invoke(IPC.appsDelete, id),
    changeStatus: (id, status, note) =>
      ipcRenderer.invoke(IPC.appsChangeStatus, id, status, note),
    history: (id) => ipcRenderer.invoke(IPC.appsHistory, id)
  },
  settings: {
    get: () => ipcRenderer.invoke(IPC.settingsGet),
    update: (patch) => ipcRenderer.invoke(IPC.settingsUpdate, patch),
    resetAll: () => ipcRenderer.invoke(IPC.settingsReset)
  },
  data: {
    export: () => ipcRenderer.invoke(IPC.dataExport),
    pickImport: () => ipcRenderer.invoke(IPC.dataPickImport),
    doImport: (token) => ipcRenderer.invoke(IPC.dataDoImport, token)
  },
  seed: {
    load: () => ipcRenderer.invoke(IPC.seedLoad)
  },
  notifications: {
    show: (title, body) => ipcRenderer.invoke(IPC.notifyShow, title, body)
  },
  app: {
    info: () => ipcRenderer.invoke(IPC.appInfo)
  }
}

contextBridge.exposeInMainWorld('trabaho', api)

export type { TrabahoApi }