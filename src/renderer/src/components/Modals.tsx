import { ApplicationFormModal } from './ApplicationFormModal.tsx'
import { DetailsModal } from './DetailsModal.tsx'
import { ChangeStatusModal } from './ChangeStatusModal.tsx'
import { Modal } from './Modal.tsx'
import { useAppStore } from '../store.ts'
import { useUiStore } from '../uiStore.ts'
import { toast } from '../toasts.ts'

export function Modals(): React.ReactNode {
  const modal = useUiStore((s) => s.modal)

  return (
    <>
      {modal.kind === 'add' ? <ApplicationFormModal mode="add" /> : null}
      {modal.kind === 'edit' ? <ApplicationFormModal mode="edit" appId={modal.id} /> : null}
      {modal.kind === 'details' ? <DetailsModal appId={modal.id} /> : null}
      {modal.kind === 'status' ? <ChangeStatusModal appId={modal.id} /> : null}
      <ImportPreviewModal />
    </>
  )
}

function ImportPreviewModal(): React.ReactNode {
  const preview = useUiStore((s) => s.importPreview)
  const busy = useUiStore((s) => s.importBusy)
  const setImportPreview = useUiStore((s) => s.setImportPreview)
  const setImportBusy = useUiStore((s) => s.setImportBusy)
  const doImport = useAppStore((s) => s.doImport)

  const onImport = async (): Promise<void> => {
    if (!preview) return
    setImportBusy(true)
    try {
      const result = await doImport(preview.token)
      setImportPreview(null)
      toast('success', `Restored ${result.importedApplications} applications.`)
    } catch (err) {
      toast('error', (err as Error).message)
    } finally {
      setImportBusy(false)
    }
  }

  return (
    <Modal
      open={!!preview}
      onClose={() => {
        if (!busy) setImportPreview(null)
      }}
      title="Import Backup"
      subtitle={preview ? `Backed up ${new Date(preview.exportedAt).toLocaleString()}` : undefined}
      width="max-w-md"
    >
      {preview ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-app-border bg-app-subtle px-4 py-3 text-sm text-app-muted">
            This will restore data from the selected backup. Your current data is
            automatically saved beforehand as a safety copy.
          </div>
          {preview.applications > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-app-border p-4 text-center">
                <div className="text-2xl font-bold text-app-text tabular-nums">
                  {preview.applications.toLocaleString()}
                </div>
                <div className="text-xs font-medium text-app-muted">Applications</div>
              </div>
              <div className="rounded-xl border border-app-border p-4 text-center">
                <div className="text-2xl font-bold text-app-text tabular-nums">
                  {preview.history.toLocaleString()}
                </div>
                <div className="text-xs font-medium text-app-muted">Status changes</div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-app-faint">
              This backup contains no applications.
            </p>
          )}
          <div className="flex justify-end gap-3 border-t border-app-border pt-4">
            <button
              onClick={() => setImportPreview(null)}
              disabled={busy}
              className="rounded-xl border border-app-border px-4 py-2 text-sm font-medium text-app-muted transition-colors hover:bg-app-subtle hover:text-app-text"
            >
              Cancel
            </button>
            <button
              onClick={() => void onImport()}
              disabled={busy}
              className="rounded-xl bg-app-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-app-accent-hover disabled:opacity-60"
            >
              {busy ? 'Importing…' : 'Import'}
            </button>
          </div>
        </div>
      ) : null}
    </Modal>
  )
}