import { useState, useMemo, useCallback } from 'react'
import { Plus, Search, Loader2, Pencil, Trash2, Repeat, PauseCircle, Undo2, CalendarClock } from 'lucide-react'
import { useICEItems, useUpdateICEItem, useDeleteICEItem } from '@/hooks/useICEItems'
import { ICE_BUCKET_CONFIG } from '@/lib/constants'
import type { ICEItem } from '@/types/ice'
import { cn, formatRelativeDate } from '@/lib/utils'
import { InlineText } from '@/components/shared/InlineText'
import { ICEItemDialog } from '@/components/ice/ICEItemDialog'

export function RecurringPage() {
  const { data: items = [], isLoading } = useICEItems()
  const updateItem = useUpdateICEItem()
  const deleteItem = useDeleteICEItem()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ICEItem | null>(null)
  const [search, setSearch] = useState('')

  const matchesSearch = useCallback((item: ICEItem) => {
    if (!search) return true
    const q = search.toLowerCase()
    return item.title.toLowerCase().includes(q) || (item.description?.toLowerCase().includes(q) ?? false)
  }, [search])

  const recurringItems = useMemo(() => items.filter((i) => i.kind === 'recurring' && matchesSearch(i)), [items, matchesSearch])
  const waitingItems = useMemo(() => items.filter((i) => i.kind === 'waiting' && matchesSearch(i)), [items, matchesSearch])

  const openDialog = (item?: ICEItem) => {
    setEditingItem(item ?? null)
    setDialogOpen(true)
  }

  // Compacte rij voor geparkeerde items (doorlopend / wachtend).
  const renderParkedRow = (item: ICEItem) => {
    const isRecurring = item.kind === 'recurring'
    const Icon = isRecurring ? Repeat : PauseCircle
    return (
      <div key={item.id} className="flex items-start gap-3 border-b border-border/30 px-4 py-3 last:border-0 hover:bg-surface-light/20 transition-colors">
        <Icon size={15} className={cn('mt-0.5 shrink-0', isRecurring ? 'text-violet-400' : 'text-amber-400')} />
        <div className="flex-1 min-w-0">
          <InlineText
            value={item.title}
            onSave={(v) => updateItem.mutate({ id: item.id, title: v })}
            className="text-sm font-medium text-text-main"
          />
          <InlineText
            value={item.description || ''}
            onSave={(v) => updateItem.mutate({ id: item.id, description: v || null })}
            className="text-xs text-text-dim"
            placeholder="—"
          />
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            {isRecurring && (
              <span className="inline-flex items-center gap-1 text-[11px] text-violet-300">
                <Repeat size={10} className="shrink-0" />
                <InlineText
                  value={item.cadence || ''}
                  onSave={(v) => updateItem.mutate({ id: item.id, cadence: v || null })}
                  placeholder="cadans toevoegen…"
                  className="text-[11px] text-violet-300"
                />
              </span>
            )}
            {item.next_due && (
              <span className="inline-flex items-center gap-1 text-[11px] text-text-dim">
                <CalendarClock size={10} /> {formatRelativeDate(item.next_due)}
              </span>
            )}
            {item.buckets?.map((bucket) => {
              const config = ICE_BUCKET_CONFIG[bucket]
              return config ? (
                <span key={bucket} className={cn('rounded px-1.5 py-0.5 text-[10px] font-medium', config.bgColor)}>
                  {config.label}
                </span>
              ) : null
            })}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={() => updateItem.mutate({ id: item.id, kind: 'oneoff' })}
            title="Naar het ICE-bord verplaatsen (weer scoren als eenmalige taak)"
            className="rounded-md p-1.5 text-text-dim hover:bg-surface-light hover:text-sky-400"
          >
            <Undo2 size={14} />
          </button>
          <button
            onClick={() => openDialog(item)}
            className="rounded-md p-1.5 text-text-dim hover:bg-surface-light hover:text-primary"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => { if (confirm(`"${item.title}" verwijderen?`)) deleteItem.mutate(item.id) }}
            className="rounded-md p-1.5 text-text-dim hover:bg-danger-muted hover:text-danger"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return <div className="flex justify-center py-32"><Loader2 size={32} className="animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Doorlopend &amp; wachtend</h1>
          <p className="text-sm text-text-muted">Cadensen, retainers en geparkeerde taken. Geen ICE-score, wel in de gaten houden.</p>
        </div>
        <button
          onClick={() => openDialog()}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-midnight hover:bg-primary-hover"
        >
          <Plus size={16} />
          Nieuw doorlopend
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Zoek op titel of omschrijving..."
          className="w-full rounded-lg border border-border bg-surface-light pl-9 pr-3 py-2 text-sm text-text-main placeholder:text-text-dim focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Doorlopende verplichtingen */}
      <section className="space-y-2">
        <h2 className="font-display text-base font-semibold flex items-center gap-2">
          <Repeat size={15} className="text-violet-400" />
          Doorlopende verplichtingen
          <span className="rounded-full bg-surface-light px-2 py-0.5 text-xs font-normal text-text-dim">{recurringItems.length}</span>
        </h2>
        <div className="rounded-xl border border-border bg-surface/30 overflow-hidden">
          {recurringItems.length > 0
            ? recurringItems.map(renderParkedRow)
            : <p className="py-8 text-center text-sm text-text-dim">Geen doorlopende verplichtingen</p>}
        </div>
      </section>

      {/* Wachtend / geblokkeerd */}
      <section className="space-y-2">
        <h2 className="font-display text-base font-semibold flex items-center gap-2">
          <PauseCircle size={15} className="text-amber-400" />
          Wachtend / geblokkeerd
          <span className="rounded-full bg-surface-light px-2 py-0.5 text-xs font-normal text-text-dim">{waitingItems.length}</span>
        </h2>
        <p className="text-xs text-text-dim">Geparkeerd: wacht op iets externs. Geen actieve prioriteit tot het gedeblokkeerd is.</p>
        <div className="rounded-xl border border-border bg-surface/30 overflow-hidden">
          {waitingItems.length > 0
            ? waitingItems.map(renderParkedRow)
            : <p className="py-8 text-center text-sm text-text-dim">Niets wachtend</p>}
        </div>
      </section>

      <ICEItemDialog
        open={dialogOpen}
        editingItem={editingItem}
        defaultKind="recurring"
        onClose={() => setDialogOpen(false)}
      />
    </div>
  )
}
