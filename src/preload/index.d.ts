import type { TrabahoApi } from '@shared/ipc.ts'

declare global {
  interface Window {
    trabaho: TrabahoApi
  }
}

export {}