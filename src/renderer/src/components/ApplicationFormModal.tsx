import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { todayKey } from '@shared/dates.ts'
import type { Application, ApplicationInput } from '@shared/types.ts'
import { Modal } from './Modal.tsx'
import { useAppStore } from '../store.ts'
import { useUiStore } from '../uiStore.ts'
import { toast } from '../toasts.ts'

interface FormState {
  companyName: string
  companyEmail: string
  noCompanyEmail: boolean
  position: string
  dateApplied: string
  jobSource: string
  jobUrl: string
  location: string
  salary: string
  contactPerson: string
  notes: string
}

function toForm(app?: Application): FormState {
  return {
    companyName: app?.companyName ?? '',
    companyEmail: app?.companyEmail ?? '',
    noCompanyEmail: !app?.companyEmail,
    position: app?.position ?? '',
    dateApplied: app?.dateApplied ?? todayKey(),
    jobSource: app?.jobSource ?? '',
    jobUrl: app?.jobUrl ?? '',
    location: app?.location ?? '',
    salary: app?.salary ?? '',
    contactPerson: app?.contactPerson ?? '',
    notes: app?.notes ?? ''
  }
}

export function ApplicationFormModal({
  mode,
  appId
}: {
  mode: 'add' | 'edit'
  appId?: string
}): React.ReactNode {
  const addApp = useAppStore((s) => s.addApp)
  const updateApp = useAppStore((s) => s.updateApp)
  const setModal = useUiStore((s) => s.setModal)
  const app = useAppStore((s) => s.apps.find((a) => a.id === appId))

  const [form, setForm] = useState<FormState>(() => toForm(app))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (app) setForm(toForm(app))
  }, [app])

  const isEdit = mode === 'edit'

  const set = (key: keyof FormState) => (value: string): void => {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const submit = async (e: FormEvent): Promise<void> => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const input: ApplicationInput = {
        companyName: form.companyName.trim(),
        companyEmail: form.noCompanyEmail ? null : form.companyEmail.trim() || null,
        position: form.position.trim(),
        dateApplied: form.dateApplied,
        jobSource: trimOrNull(form.jobSource),
        jobUrl: trimOrNull(form.jobUrl),
        location: trimOrNull(form.location),
        salary: trimOrNull(form.salary),
        contactPerson: trimOrNull(form.contactPerson),
        notes: trimOrNull(form.notes)
      }
      if (isEdit && app) {
        await updateApp(app.id, input)
        toast('success', 'Application updated successfully.')
      } else {
        await addApp(input)
        toast('success', 'Application added successfully.')
      }
      setModal({ kind: 'none' })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass =
    'w-full rounded-xl border border-app-border bg-app-subtle/60 px-3.5 py-2.5 text-sm text-app-text placeholder:text-app-faint outline-none transition-colors focus:border-app-accent focus:ring-2 focus:ring-app-accent/25'

  return (
    <Modal
      open
      onClose={() => { if (!submitting) setModal({ kind: 'none' }) }}
      title={isEdit ? 'Edit Application' : 'Add Application'}
      subtitle={
        isEdit
          ? `Update the details for ${app?.companyName ?? ''}`
          : 'New applications start as Pending.'
      }
    >
      <form onSubmit={(e) => void submit(e)} className="space-y-4">
        {error ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        ) : null}

        <div className="text-xs font-semibold uppercase tracking-wide text-app-faint">
          Required
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-app-text">
              Company Name *
            </label>
            <input
              className={inputClass}
              value={form.companyName}
              onChange={(e) => set('companyName')(e.target.value)}
              placeholder="Acme Corporation"
              autoFocus
              required
            />
          </div>
          <div className="col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-app-text">
              Position *
            </label>
            <input
              className={inputClass}
              value={form.position}
              onChange={(e) => set('position')(e.target.value)}
              placeholder="Frontend Developer"
              required
            />
          </div>
          <div className="col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-app-text">
              Date Applied *
            </label>
            <input
              className={inputClass}
              type="date"
              value={form.dateApplied}
              max={todayKey()}
              onChange={(e) => set('dateApplied')(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="pt-1 text-xs font-semibold uppercase tracking-wide text-app-faint">
          Optional
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-app-text">
              Company Email
            </label>
            <input
              className={`${inputClass} ${form.noCompanyEmail ? 'opacity-50' : ''}`}
              type="email"
              value={form.companyEmail}
              onChange={(e) => set('companyEmail')(e.target.value)}
              placeholder="hr@acme.com"
              disabled={form.noCompanyEmail}
            />
            <label className="mt-2 inline-flex cursor-pointer items-center gap-2 text-sm text-app-muted select-none">
              <input
                type="checkbox"
                checked={form.noCompanyEmail}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    noCompanyEmail: e.target.checked,
                    ...(e.target.checked ? { companyEmail: '' } : {})
                  }))
                }
                className="h-4 w-4 rounded border-app-border text-app-accent accent-app-accent"
              />
              I didn't get the company email
            </label>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-app-text">Job Source</label>
            <input
              className={inputClass}
              value={form.jobSource}
              onChange={(e) => set('jobSource')(e.target.value)}
              placeholder="LinkedIn, JobStreet, referral…"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-app-text">Contact Person</label>
            <input
              className={inputClass}
              value={form.contactPerson}
              onChange={(e) => set('contactPerson')(e.target.value)}
              placeholder="Recruiter name"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-app-text">Location</label>
            <input
              className={inputClass}
              value={form.location}
              onChange={(e) => set('location')(e.target.value)}
              placeholder="Manila, PH · Remote"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-app-text">Salary</label>
            <input
              className={inputClass}
              value={form.salary}
              onChange={(e) => set('salary')(e.target.value)}
              placeholder="PHP 80,000 – 100,000"
            />
          </div>
          <div className="col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-app-text">Job URL</label>
            <input
              className={inputClass}
              type="url"
              value={form.jobUrl}
              onChange={(e) => set('jobUrl')(e.target.value)}
              placeholder="https://jobs.example.com/offer/123"
            />
          </div>
          <div className="col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-app-text">Notes</label>
            <textarea
              className={`${inputClass} min-h-24 resize-y`}
              value={form.notes}
              onChange={(e) => set('notes')(e.target.value)}
              placeholder="Interviews scheduled, recruiter screen, respond dates…"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-app-border pt-4">
          <button
            type="button"
            onClick={() => setModal({ kind: 'none' })}
            disabled={submitting}
            className="rounded-xl border border-app-border px-4 py-2 text-sm font-medium text-app-muted transition-colors hover:bg-app-subtle hover:text-app-text"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-app-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-app-accent-hover disabled:opacity-60"
          >
            {isEdit ? 'Save Changes' : 'Add Application'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function trimOrNull(value: string): string | null {
  const t = value.trim()
  return t.length > 0 ? t : null
}