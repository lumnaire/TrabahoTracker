import { useEffect, useState } from 'react'
import { useAppStore } from '../store.ts'

export function useIsDark(): boolean {
  const theme = useAppStore((s) => s.settings?.theme ?? 'system')
  const [systemDark, setSystemDark] = useState<boolean>(
    () => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
  )

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e: MediaQueryListEvent): void => setSystemDark(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const isDark = theme === 'dark' || (theme === 'system' && systemDark)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
  }, [isDark])

  return isDark
}