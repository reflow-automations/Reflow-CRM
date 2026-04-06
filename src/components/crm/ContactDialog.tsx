import { useState, useEffect } from 'react'
import { X, Save, Loader2 } from 'lucide-react'
import { useCreateContact, useUpdateContact } from '@/hooks/useContacts'
import { STATUS_CONFIG, PRIORITY_CONFIG, SOURCE_CONFIG, type ContactStatus, type ContactPriority, type ContactSource } from '@/lib/constants'
import { EMPTY_CONTACT_FORM, type Contact, type ContactFormData } from '@/types/contacts'
import { cn } from '@/lib/utils'

interface ContactDialogProps {
  open: boolean
  onClose: () => void
  contact?: Contact | null
  defaultStatus?: ContactStatus
}

export function ContactDialog({ open, onClose, contact, defaultStatus }: ContactDialogProps) {
  const [form, setForm] = useState<ContactFormData>(EMPTY_CONTACT_FORM)
  const createContact = useCreateContact()
  const updateContact = useUpdateContact()
  const isEditing = !!contact

  useEffect(() => {
    if (contact) {
      setForm({
        name: contact.name,
        company: contact.company ?? '',
        email: contact.email ?? '',
        phone: contact.phone ?? '',
        next_follow_up: contact.next_follow_up ?? '',
        priority: contact.priority,
        source: contact.source,
        status: contact.status,
        linkedin_url: contact.linkedin_url ?? '',
        website: contact.website ?? '',
      })
    } else {
      setForm({ ...EMPTY_CONTACT_FORM, status: defaultStatus ?? 'contacted' })
    }
  }, [contact, defaultStatus, open])

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isEditing) {
      await updateContact.mutateAsync({ id: contact.id, ...form })
    } else {
      await createContact.mutateAsync(form)
    }
    onClose()
  }

  const isPending = createContact.isPending || updateContact.isPending

  const updateField = <K extends keyof ContactFormData>(key: K, value: ContactFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-border bg-surface shadow-2xl shadow-black/30">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="font-display text-lg font-semibold">
            {isEditing ? 'Contact bewerken' : 'Nieuw contact'}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-text-muted hover:bg-surface-light hover:text-text-main">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="mb-1 block text-sm font-medium text-text-muted">Naam *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                className="w-full rounded-lg border border-border bg-surface-light px-3 py-2 text-sm text-text-main placeholder:text-text-dim focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Contactnaam"
                required
              />
            </div>

            {/* Company + Email row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-text-muted">Bedrijf</label>
                <input
                  type="text"
                  value={form.company}
                  onChange={(e) => updateField('company', e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface-light px-3 py-2 text-sm text-text-main placeholder:text-text-dim focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Bedrijfsnaam"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-text-muted">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface-light px-3 py-2 text-sm text-text-main placeholder:text-text-dim focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="email@bedrijf.nl"
                />
              </div>
            </div>

            {/* Phone + Follow-up */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-text-muted">Telefoon</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface-light px-3 py-2 text-sm text-text-main placeholder:text-text-dim focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="+31 6..."
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-text-muted">Opvolgdatum</label>
                <input
                  type="date"
                  value={form.next_follow_up}
                  onChange={(e) => updateField('next_follow_up', e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface-light px-3 py-2 text-sm text-text-main focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-muted">Status</label>
              <div className="flex flex-wrap gap-2">
                {(Object.entries(STATUS_CONFIG) as [ContactStatus, typeof STATUS_CONFIG[ContactStatus]][]).map(([key, config]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => updateField('status', key)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all',
                      form.status === key
                        ? `${config.bgColor} ring-1 ring-offset-1 ring-offset-surface`
                        : 'border-border bg-surface-light text-text-muted hover:bg-surface-hover'
                    )}
                  >
                    <span className={cn('h-2 w-2 rounded-full', config.dotColor)} />
                    {config.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority + Source row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-muted">Prioriteit</label>
                <div className="flex gap-2">
                  {(Object.entries(PRIORITY_CONFIG) as [ContactPriority, typeof PRIORITY_CONFIG[ContactPriority]][]).map(([key, config]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => updateField('priority', key)}
                      className={cn(
                        'flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all',
                        form.priority === key
                          ? `border-current ${config.color} bg-current/10`
                          : 'border-border bg-surface-light text-text-muted hover:bg-surface-hover'
                      )}
                    >
                      {config.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-muted">Bron</label>
                <select
                  value={form.source}
                  onChange={(e) => updateField('source', e.target.value as ContactSource)}
                  className="w-full rounded-lg border border-border bg-surface-light px-3 py-2 text-sm text-text-main focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {(Object.entries(SOURCE_CONFIG) as [ContactSource, typeof SOURCE_CONFIG[ContactSource]][]).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* LinkedIn + Website */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-text-muted">LinkedIn</label>
                <input
                  type="url"
                  value={form.linkedin_url}
                  onChange={(e) => updateField('linkedin_url', e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface-light px-3 py-2 text-sm text-text-main placeholder:text-text-dim focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="linkedin.com/in/..."
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-text-muted">Website</label>
                <input
                  type="url"
                  value={form.website}
                  onChange={(e) => updateField('website', e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface-light px-3 py-2 text-sm text-text-main placeholder:text-text-dim focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-muted hover:bg-surface-light"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={isPending || !form.name}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-midnight hover:bg-primary-hover disabled:opacity-50"
            >
              {isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {isEditing ? 'Opslaan' : 'Toevoegen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
