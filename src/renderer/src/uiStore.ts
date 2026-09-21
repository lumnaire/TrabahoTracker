import { create } from 'zustand'
import type { ApplicationStatus } from '@shared/types.ts'
import type { AppInfo } from '@shared/ipc.ts'

export type PageKey = 'dashboard' | 'track' | 'analytics' | 'settings'
export type StatusFilter = 'all' | ApplicationStatus
export type SortKey = 'newest' | 'oldest' | 'company-az' | 'company-za' | 'recent' | 'status'

export type ModalState =
  | { kind: 'none' }
  | { kind: 'add' }
  | { kind: 'edit'; id: string }
  | { kind: 'details'; id: string }
  | { kind: 'status'; id: string }

export interface ConfirmOptions {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  /** Show a small breakdown box with these details. */
  details?: { label: string; value: string }[]
}

export interface ImportPreviewState {
  token: string
  exportedAt: string
  applications: number
  history: number
}

interface UiStore {
  page: PageKey
  trackFilter: StatusFilter
  trackQuery: string
  trackSort: SortKey
  trackPage: number
  pageSize: number
  modal: ModalState
  confirm: ConfirmOptions | null
  confirmResolve: ((value: boolean) => void) | null
  appInfo: AppInfo | null
  importPreview: ImportPreviewState | null
  importBusy: boolean
  setPage: (page: PageKey) => void
  goTrack: (filter?: StatusFilter) => void
  setTrackFilter: (filter: StatusFilter) => void
  setTrackQuery: (query: string) => void
  setTrackSort: (sort: SortKey) => void
  setTrackPage: (page: number) => void
  setModal: (modal: ModalState) => void
  ask: (opts: ConfirmOptions) => Promise<boolean>
  settle: (value: boolean) => void
  setAppInfo: (info: AppInfo) => void
  setImportPreview: (preview: ImportPreviewState | null) => void
  setImportBusy: (busy: boolean) => void
}

export const useUiStore = create<UiStore>((set, get) => ({
  page: 'dashboard',
  trackFilter: 'all',
  trackQuery: '',
  trackSort: 'newest',
  trackPage: 1,
  pageSize: 12,
  modal: { kind: 'none' },
  confirm: null,
  confirmResolve: null,
  appInfo: null,
  importPreview: null,
  importBusy: false,

  setPage: (page) => set({ page }),
  goTrack: (filter) =>
    set({ page: 'track', trackFilter: filter ?? 'all', trackPage: 1 }),
  setTrackFilter: (filter) => set({ trackFilter: filter, trackPage: 1 }),
  setTrackQuery: (query) => set({ trackQuery: query, trackPage: 1 }),
  setTrackSort: (sort) => set({ trackSort: sort }),
  setTrackPage: (page) => set({ trackPage: page }),
  setModal: (modal) => set({ modal }),

  ask: (opts) =>
    new Promise((resolve) => {
      set({ confirm: opts, confirmResolve: resolve })
    }),
  settle: (value) => {
    const resolve = get().confirmResolve
    set({ confirm: null, confirmResolve: null })
    resolve?.(value)
  },
  setAppInfo: (appInfo) => set({ appInfo }),
  setImportPreview: (importPreview) => set({ importPreview }),
  setImportBusy: (importBusy) => set({ importBusy })
}))