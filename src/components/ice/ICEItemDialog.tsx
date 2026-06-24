import { useState, useEffect } from 'react'
import { useCreateICEItem, useUpdateICEItem } from '@/hooks/useICEItems'
import { ICE_BUCKET_CONFIG, ICE_STATUS_CONFIG, ICE_KIND_CONFIG, type ICEBucket, type ICEStatus, type ICEKind } from '@/lib/constants'
import type { ICEItem, ICEFormData } from '@/types/ice'
import { EMPTY_ICE_FORM } from '@/types/ice'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  editingItem: ICEItem | null
  defaultKind?: ICEKind
  onClose: () => void
}

// Gedeelde add/edit-modal voor ICE-items, gebruikt door zowel het eenmalige ICE-bord
// als het doorlopende bord.
export function ICEItemDialog({ open, editingItem, defaultKind = 'oneoff', onClose }: Props) {
  const createItem = useCreateICEItem()
  const updateItem = useUpdateICEItem()
  const [form, setForm] = useState<ICEFormData>(EMPTY_ICE_FORM)

  useEffect(() => {
    if (!open) return
    if (editingItem) {
      setForm({
        title: editingItem.title,
        description: editingItem.description ?? '',
        buckets: editingItem.buckets ?? [],
        impact: editingItem.impact,
        importance: editingItem.importance,
        time_estimate: editingItem.time_estimate,
        difficulty: editingItem.difficulty,
        status: editingItem.status,
        kind: editingItem.kind,
        cadence: editingItem.cadence ?? '',
        next_due: editingItem.next_due ?? '',
      })
    } else {
      setForm({ ...EMPTY_ICE_FORM, kind: defaultKind })
    }
  }, [open, editingItem, defaultKind])

  const toggleFormBucket = (bucket: ICEBucket) => {
    setForm((prev) => ({
      ...prev,
      buckets: prev.buckets.includes(bucket)
        ? prev.buckets.filter((b) => b !== bucket)
        : [...prev.buckets, bucket],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingItem) {
      await updateItem.mutateAsync({ id: editingItem.id, ...form })
    } else {
      await createItem.mutateAsync(form)
    }
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-border bg-surface shadow-2xl shadow-black/30 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="font-display text-lg font-semibold">{editingItem ? 'Item bewerken' : 'Nieuw item'}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-text-muted hover:bg-surface-light">
            <span className="sr-only">Sluiten</span>✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Type */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-muted">Type</label>
            <div className="flex gap-2">
              {(Object.entries(ICE_KIND_CONFIG) as [ICEKind, typeof ICE_KIND_CONFIG[ICEKind]][]).map(([key, config]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setForm({ ...form, kind: key })}
                  className={cn(
                    'flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all',
                    form.kind === key
                      ? `${config.bgColor} border-current`
                      : 'border-border bg-surface-light text-text-muted hover:bg-surface-hover'
                  )}
                >
                  {config.label}
                </button>
              ))}
            </div>
            {form.kind !== 'oneoff' && (
              <p className="mt-1.5 text-[11px] text-text-dim">
                {form.kind === 'recurring'
                  ? 'Doorlopende verplichting: staat op het Doorlopend-bord, doet niet mee in de ICE-score.'
                  : 'Geblokkeerd/wachtend op extern: geparkeerd op het Doorlopend-bord, geen actieve prioriteit.'}
              </p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-muted">Titel *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-lg border border-border bg-surface-light px-3 py-2 text-sm text-text-main placeholder:text-text-dim focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Titel"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-muted">Omschrijving</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full rounded-lg border border-border bg-surface-light px-3 py-2 text-sm text-text-main placeholder:text-text-dim focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              placeholder="Beschrijf het item..."
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-muted">Buckets</label>
            <div className="flex flex-wrap gap-1.5">
              {(Object.entries(ICE_BUCKET_CONFIG) as [ICEBucket, typeof ICE_BUCKET_CONFIG[ICEBucket]][]).map(([key, config]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleFormBucket(key)}
                  className={cn(
                    'rounded-md px-2 py-1 text-xs font-medium transition-all border',
                    form.buckets.includes(key)
                      ? `${config.bgColor} border-current`
                      : 'border-border bg-surface-light text-text-dim hover:bg-surface-hover'
                  )}
                >
                  {config.label}
                </button>
              ))}
            </div>
          </div>

          {form.kind === 'recurring' ? (
            /* Doorlopend: cadans + volgende keer i.p.v. score-sliders */
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-violet-400">Cadans</label>
                <input
                  type="text"
                  value={form.cadence}
                  onChange={(e) => setForm({ ...form, cadence: e.target.value })}
                  className="w-full rounded-lg border border-border bg-surface-light px-3 py-2 text-sm text-text-main placeholder:text-text-dim focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="bv. Elke 2 weken (dinsdag)"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-text-muted">Volgende keer</label>
                <input
                  type="date"
                  value={form.next_due}
                  onChange={(e) => setForm({ ...form, next_due: e.target.value })}
                  className="w-full rounded-lg border border-border bg-surface-light px-3 py-2 text-sm text-text-main focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          ) : (
            /* Eenmalig / wachtend: score-sliders */
            <>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'impact' as const, label: 'Impact', color: 'text-primary' },
                  { key: 'importance' as const, label: 'Importance', color: 'text-accent' },
                  { key: 'time_estimate' as const, label: 'Time', color: 'text-blue-400' },
                  { key: 'difficulty' as const, label: 'Difficulty', color: 'text-purple-400' },
                ].map(({ key, label, color }) => (
                  <div key={key}>
                    <label className={cn('mb-1 block text-sm font-medium', color)}>{label}: {form[key]}</label>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={form[key]}
                      onChange={(e) => setForm({ ...form, [key]: Number(e.target.value) })}
                      className="w-full accent-primary"
                    />
                    <div className="flex justify-between text-[10px] text-text-dim">
                      <span>1</span><span>5</span><span>10</span>
                    </div>
                  </div>
                ))}
              </div>
              {/* Preview score */}
              <div className="rounded-lg bg-surface-light px-4 py-3 text-center">
                <span className="text-xs text-text-dim">Geschatte score: </span>
                <span className="font-display text-lg font-bold text-primary">
                  {((form.impact * form.importance) / Math.max(Math.sqrt(form.time_estimate * form.difficulty), 1) * 10).toFixed(1)}
                </span>
              </div>
            </>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-muted">Status</label>
            <div className="flex gap-2">
              {(Object.entries(ICE_STATUS_CONFIG) as [ICEStatus, typeof ICE_STATUS_CONFIG[ICEStatus]][]).map(([key, config]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setForm({ ...form, status: key })}
                  className={cn(
                    'flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all',
                    form.status === key
                      ? `${config.bgColor} border-current`
                      : 'border-border bg-surface-light text-text-muted hover:bg-surface-hover'
                  )}
                >
                  {config.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-muted hover:bg-surface-light">
              Annuleren
            </button>
            <button type="submit" disabled={!form.title} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-midnight hover:bg-primary-hover disabled:opacity-50">
              {editingItem ? 'Opslaan' : 'Toevoegen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
