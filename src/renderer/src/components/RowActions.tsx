import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { MoreHorizontal, Pencil, Eye, RefreshCw, Trash2 } from 'lucide-react'
import type { Application } from '@shared/types.ts'
import { useAppStore } from '../store.ts'
import { useUiStore } from '../uiStore.ts'
import { toast } from '../toasts.ts'

const MENU_WIDTH = 176

interface MenuState {
  open: boolean
  left: number
  top: number
}

export function RowActions({ app }: { app: Application }): React.ReactNode {
  const [menu, setMenu] = useState<MenuState | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const setModal = useUiStore((s) => s.setModal)
  const removeApp = useAppStore((s) => s.removeApp)
  const ask = useUiStore((s) => s.ask)

  // Portal-based so the menu is never clipped by the table's overflow.
  useEffect(() => {
    if (!menu) return
    const onPointerDown = (e: PointerEvent): void => {
      const target = e.target as Node
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return
      setMenu(null)
    }
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setMenu(null)
    }
    const close = (): void => setMenu(null)
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKey)
    window.addEventListener('resize', close)
    window.addEventListener('scroll', close, true)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', close)
      window.removeEventListener('scroll', close, true)
    }
  }, [menu])

  const openMenu = (): void => {
    const rect = buttonRef.current?.getBoundingClientRect()
    if (!rect) return
    setMenu({
      open: true,
      left: Math.min(rect.right, window.innerWidth - 8) - MENU_WIDTH,
      top: rect.bottom + 6
    })
  }

  const toggle = (): void => {
    if (menu) setMenu(null)
    else openMenu()
  }

  const itemClass =
    'flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-app-subtle'

  const onDelete = async (): Promise<void> => {
    setMenu(null)
    const ok = await ask({
      title: 'Delete Application?',
      message: 'Are you sure you want to delete this application? This action cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true,
      details: [
        { label: 'Company', value: app.companyName },
        { label: 'Position', value: app.position }
      ]
    })
    if (!ok) return
    try {
      await removeApp(app.id)
      toast('success', 'Application deleted.')
    } catch (err) {
      toast('error', (err as Error).message)
    }
  }

  return (
    <>
      <button
        ref={buttonRef}
        onClick={toggle}
        aria-label="Actions"
        aria-expanded={menu?.open ?? false}
        className="rounded-lg p-1.5 text-app-faint transition-colors hover:bg-app-subtle hover:text-app-text"
      >
        <MoreHorizontal className="h-4.5 w-4.5" />
      </button>
      {menu
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              className="fixed z-50 w-44 overflow-hidden rounded-xl border border-app-border bg-app-card py-1 shadow-lg animate-fade"
              style={{ left: menu.left, top: menu.top }}
            >
              <button
                className={itemClass}
                onClick={() => {
                  setMenu(null)
                  setModal({ kind: 'details', id: app.id })
                }}
              >
                <Eye className="h-4 w-4 text-app-faint" /> See Details
              </button>
              <button
                className={itemClass}
                onClick={() => {
                  setMenu(null)
                  setModal({ kind: 'edit', id: app.id })
                }}
              >
                <Pencil className="h-4 w-4 text-app-faint" /> Edit
              </button>
              <button
                className={itemClass}
                onClick={() => {
                  setMenu(null)
                  setModal({ kind: 'status', id: app.id })
                }}
              >
                <RefreshCw className="h-4 w-4 text-app-faint" /> Change Status
              </button>
              <div className="mx-3 my-1 border-t border-app-border" />
              <button className={`${itemClass} text-app-danger`} onClick={() => void onDelete()}>
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            </div>,
            document.body
          )
        : null}
    </>
  )
}