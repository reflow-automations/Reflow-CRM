import { useState, useMemo, useRef, useCallback } from 'react'
import { Plus, Search, Loader2, Pencil, Trash2, ArrowUpDown, Info, Repeat, PauseCircle, Undo2, CalendarClock } from 'lucide-react'
import { useICEItems, useCreateICEItem, useUpdateICEItem, useDeleteICEItem } from '@/hooks/useICEItems'
import { ICE_BUCKET_CONFIG, ICE_STATUS_CONFIG, ICE_KIND_CONFIG, type ICEBucket, type ICEStatus, type ICEKind } from '@/lib/constants'
import type { ICEItem, ICEFormData } from '@/types/ice'
import { EMPTY_ICE_FORM } from '@/types/ice'
import { cn, formatRelativeDate } from '@/lib/utils'
import { InlineNumber } from '@/components/shared/InlineNumber'
import { InlineText } from '@/components/shared/InlineText'

export function ICEPage() {
  const { data: items = [], isLoading } = useICEItems()
  const createItem = useCreateICEItem()
  const updateItem = useUpdateICEItem()
  const deleteItem = useDeleteICEItem()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ICEItem | null>(null)
  const [form, setForm] = useState<ICEFormData>(EMPTY_ICE_FORM)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ICEStatus | 'all'>('all')
  const [bucketFilters, setBucketFilters] = useState<Set<ICEBucket>>(new Set())
  const [minScore, setMinScore] = useState(0)
  const [showInfo, setShowInfo] = useState(false)
  const [sortBy, setSortBy] = useState<'priority_score' | 'impact' | 'importance' | 'time_estimate' | 'difficulty'>('priority_score')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  // Delayed re-sort: freeze order for 10 seconds after a score change
  const [frozenOrder, setFrozenOrder] = useState<string[] | null>(null)
  const freezeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const freezeCurrentOrder = useCallback((currentItems: ICEItem[]) => {
    setFrozenOrder(currentItems.map((i) => i.id))
    if (freezeTimerRef.current) clearTimeout(freezeTimerRef.current)
    freezeTimerRef.current = setTimeout(() => {
      setFrozenOrder(null)
    }, 10000)
  }, [])

  // Split by kind: alleen 'oneoff' doet mee in de ICE-scoring/sortering.
  const oneoffItems = useMemo(() => items.filter((i) => i.kind === 'oneoff'), [items])
  const recurringItems = useMemo(() => items.filter((i) => i.kind === 'recurring'), [items])
  const waitingItems = useMemo(() => items.filter((i) => i.kind === 'waiting'), [items])

  const handleScoreUpdate = (id: string, field: string, value: number) => {
    freezeCurrentOrder(filteredItems)
    updateItem.mutate({ id, [field]: value } as Parameters<typeof updateItem.mutate>[0])
  }

  const filteredItems = useMemo(() => {
    const filtered = oneoffItems
      .filter((item) => {
        if (search) {
          const q = search.toLowerCase()
          if (!item.title.toLowerCase().includes(q) && !item.description?.toLowerCase().includes(q)) return false
        }
        if (statusFilter === 'all' && item.status === 'done') return false
        if (statusFilter !== 'all' && item.status !== statusFilter) return false
        if (bucketFilters.size > 0 && !item.buckets?.some((b) => bucketFilters.has(b))) return false
        if (item.priority_score < minScore) return false
        return true
      })

    // If order is frozen (after inline edit), use the frozen order
    if (frozenOrder) {
      const orderMap = new Map(frozenOrder.map((id, idx) => [id, idx]))
      return filtered.sort((a, b) => (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999))
    }

    return filtered.sort((a, b) => {
      const aVal = a[sortBy]
      const bVal = b[sortBy]
      return sortDir === 'desc' ? (bVal as number) - (aVal as number) : (aVal as number) - (bVal as number)
    })
  }, [oneoffItems, search, statusFilter, bucketFilters, minScore, sortBy, sortDir, frozenOrder])

  // Doorlopende + wachtende items: alleen op zoekterm filteren (geen score/status-filter).
  const matchesSearch = useCallback((item: ICEItem) => {
    if (!search) return true
    const q = search.toLowerCase()
    return item.title.toLowerCase().includes(q) || (item.description?.toLowerCase().includes(q) ?? false)
  }, [search])

  const filteredRecurring = useMemo(() => recurringItems.filter(matchesSearch), [recurringItems, matchesSearch])
  const filteredWaiting = useMemo(() => waitingItems.filter(matchesSearch), [waitingItems, matchesSearch])

  const openDialog = (item?: ICEItem, defaultKind: ICEKind = 'oneoff') => {
    if (item) {
      setEditingItem(item)
      setForm({
        title: item.title,
        description: item.description ?? '',
        buckets: item.buckets ?? [],
        impact: item.impact,
        importance: item.importance,
        time_estimate: item.time_estimate,
        difficulty: item.difficulty,
        status: item.status,
        kind: item.kind,
        cadence: item.cadence ?? '',
        next_due: item.next_due ?? '',
      })
    } else {
      setEditingItem(null)
      setForm({ ...EMPTY_ICE_FORM, kind: defaultKind })
    }
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingItem) {
      await updateItem.mutateAsync({ id: editingItem.id, ...form })
    } else {
      await createItem.mutateAsync(form)
    }
    setDialogOpen(false)
  }

  const toggleBucket = (bucket: ICEBucket) => {
    setBucketFilters((prev) => {
      const next = new Set(prev)
      if (next.has(bucket)) next.delete(bucket)
      else next.add(bucket)
      return next
    })
  }

  const toggleFormBucket = (bucket: ICEBucket) => {
    setForm((prev) => ({
      ...prev,
      buckets: prev.buckets.includes(bucket)
        ? prev.buckets.filter((b) => b !== bucket)
        : [...prev.buckets, bucket],
    }))
  }

  const handleSort = (col: typeof sortBy) => {
    if (sortBy === col) {
      setSortDir((d) => d === 'desc' ? 'asc' : 'desc')
    } else {
      setSortBy(col)
      setSortDir('desc')
    }
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
            title="Terug naar eenmalige taken (weer scoren)"
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
          <h1 className="font-display text-2xl font-bold tracking-tight">ICE Prioritization Board</h1>
          <p className="text-sm text-text-muted">Prioriteer je ideeën met Impact, Importance, Time en Difficulty</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="rounded-lg border border-border p-2 text-text-muted hover:bg-surface-light hover:text-text-main"
          >
            <Info size={16} />
          </button>
          <button
            onClick={() => openDialog()}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-midnight hover:bg-primary-hover"
          >
            <Plus size={16} />
            Nieuw idee
          </button>
        </div>
      </div>

      {/* Info panel */}
      {showInfo && (
        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="font-display text-base font-semibold mb-2">ICE Scoring Framework</h3>
          <p className="text-sm text-text-muted mb-3">
            Score = (Impact x Importance) / √(Time x Difficulty) x 10. Hogere impact/importance en lagere time/difficulty geven een hogere score.
          </p>
          <div className="grid grid-cols-4 gap-3 text-xs">
            <div className="rounded-lg bg-primary/10 p-3">
              <p className="font-semibold text-primary mb-1">Impact (1-10)</p>
              <p className="text-text-dim">Hoeveel verschil maakt dit?</p>
            </div>
            <div className="rounded-lg bg-accent/10 p-3">
              <p className="font-semibold text-accent mb-1">Importance (1-10)</p>
              <p className="text-text-dim">Hoe belangrijk is het?</p>
            </div>
            <div className="rounded-lg bg-blue-500/10 p-3">
              <p className="font-semibold text-blue-400 mb-1">Time (1-10)</p>
              <p className="text-text-dim">Hoeveel tijd kost het? (hoger = meer)</p>
            </div>
            <div className="rounded-lg bg-purple-500/10 p-3">
              <p className="font-semibold text-purple-400 mb-1">Difficulty (1-10)</p>
              <p className="text-text-dim">Hoe moeilijk is het? (hoger = moeilijker)</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-text-dim">
            Alleen <span className="text-sky-400 font-medium">eenmalige</span> taken worden gescoord. Doorlopende verplichtingen en wachtende items staan apart en doen niet mee in de ranking.
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Zoek op titel of omschrijving..."
              className="w-full rounded-lg border border-border bg-surface-light pl-9 pr-3 py-2 text-sm text-text-main placeholder:text-text-dim focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ICEStatus | 'all')}
            className="rounded-lg border border-border bg-surface-light px-3 py-2 text-sm text-text-muted focus:border-primary focus:outline-none"
          >
            <option value="all">Alle statussen</option>
            {Object.entries(ICE_STATUS_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-dim">Min score:</span>
            <input
              type="number"
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              min={0}
              max={10}
              className="w-16 rounded-lg border border-border bg-surface-light px-2 py-2 text-sm text-text-main focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        {/* Bucket filters */}
        <div className="flex flex-wrap gap-1.5">
          {(Object.entries(ICE_BUCKET_CONFIG) as [ICEBucket, typeof ICE_BUCKET_CONFIG[ICEBucket]][]).map(([key, config]) => (
            <button
              key={key}
              onClick={() => toggleBucket(key)}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-medium transition-all border',
                bucketFilters.has(key)
                  ? `${config.bgColor} border-current`
                  : 'border-border bg-surface-light text-text-dim hover:bg-surface-hover'
              )}
            >
              {config.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Eenmalige taken (ICE-gesorteerd) ─── */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-semibold flex items-center gap-2">
            Eenmalige taken
            <span className="text-xs font-normal text-text-dim">ICE-gesorteerd</span>
          </h2>
          <p className="text-xs text-text-dim">{filteredItems.length} van {oneoffItems.length}</p>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border bg-surface/50 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-light/50">
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-text-dim">Titel</th>
                <th className="px-3 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-text-dim">Omschrijving</th>
                <th className="px-3 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-text-dim">Buckets</th>
                <th className="px-3 py-3 text-center text-[11px] font-medium uppercase tracking-wider text-text-dim cursor-pointer hover:text-text-muted" onClick={() => handleSort('impact')}>
                  <span className="inline-flex items-center gap-1">Impact <ArrowUpDown size={10} /></span>
                </th>
                <th className="px-3 py-3 text-center text-[11px] font-medium uppercase tracking-wider text-text-dim cursor-pointer hover:text-text-muted" onClick={() => handleSort('importance')}>
                  <span className="inline-flex items-center gap-1">Importance <ArrowUpDown size={10} /></span>
                </th>
                <th className="px-3 py-3 text-center text-[11px] font-medium uppercase tracking-wider text-text-dim cursor-pointer hover:text-text-muted" onClick={() => handleSort('time_estimate')}>
                  <span className="inline-flex items-center gap-1">Time <ArrowUpDown size={10} /></span>
                </th>
                <th className="px-3 py-3 text-center text-[11px] font-medium uppercase tracking-wider text-text-dim cursor-pointer hover:text-text-muted" onClick={() => handleSort('difficulty')}>
                  <span className="inline-flex items-center gap-1">Difficulty <ArrowUpDown size={10} /></span>
                </th>
                <th className="px-3 py-3 text-center text-[11px] font-medium uppercase tracking-wider text-text-dim cursor-pointer hover:text-text-muted" onClick={() => handleSort('priority_score')}>
                  <span className="inline-flex items-center gap-1">Score <ArrowUpDown size={10} /></span>
                </th>
                <th className="px-3 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-text-dim">Status</th>
                <th className="px-3 py-3 text-center text-[11px] font-medium uppercase tracking-wider text-text-dim">Acties</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item.id} className="border-b border-border/30 hover:bg-surface-light/30 transition-colors">
                  <td className="px-4 py-3">
                    <InlineText
                      value={item.title}
                      onSave={(v) => updateItem.mutate({ id: item.id, title: v })}
                      className="text-sm font-medium text-text-main"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <InlineText
                      value={item.description || ''}
                      onSave={(v) => updateItem.mutate({ id: item.id, description: v || null })}
                      className="text-xs text-text-dim"
                      placeholder="—"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1">
                      {item.buckets?.map((bucket) => {
                        const config = ICE_BUCKET_CONFIG[bucket]
                        return config ? (
                          <span key={bucket} className={cn('rounded px-1.5 py-0.5 text-[10px] font-medium', config.bgColor)}>
                            {config.label}
                          </span>
                        ) : null
                      })}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <InlineNumber value={item.impact} onSave={(v) => handleScoreUpdate(item.id, 'impact', v)} />
                  </td>
                  <td className="px-3 py-3 text-center">
                    <InlineNumber value={item.importance} onSave={(v) => handleScoreUpdate(item.id, 'importance', v)} />
                  </td>
                  <td className="px-3 py-3 text-center">
                    <InlineNumber value={item.time_estimate} onSave={(v) => handleScoreUpdate(item.id, 'time_estimate', v)} />
                  </td>
                  <td className="px-3 py-3 text-center">
                    <InlineNumber value={item.difficulty} onSave={(v) => handleScoreUpdate(item.id, 'difficulty', v)} />
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className={cn(
                      'inline-flex h-8 min-w-[36px] items-center justify-center rounded-lg px-2 text-sm font-bold',
                      item.priority_score >= 7 ? 'bg-green-500/20 text-green-400' :
                      item.priority_score >= 4 ? 'bg-accent/20 text-accent' :
                      'bg-surface-light text-text-dim'
                    )}>
                      {item.priority_score}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <select
                      value={item.status}
                      onChange={(e) => updateItem.mutate({ id: item.id, status: e.target.value as ICEStatus })}
                      className={cn(
                        'rounded-md border-0 px-2 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer',
                        ICE_STATUS_CONFIG[item.status].bgColor
                      )}
                    >
                      {Object.entries(ICE_STATUS_CONFIG).map(([key, config]) => (
                        <option key={key} value={key}>{config.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
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
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-sm text-text-dim">
                    Geen eenmalige taken gevonden
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ─── Doorlopende verplichtingen ─── */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-semibold flex items-center gap-2">
            <Repeat size={15} className="text-violet-400" />
            Doorlopende verplichtingen
            <span className="rounded-full bg-surface-light px-2 py-0.5 text-xs font-normal text-text-dim">{recurringItems.length}</span>
          </h2>
          <button
            onClick={() => openDialog(undefined, 'recurring')}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-muted hover:bg-surface-light hover:text-text-main"
          >
            <Plus size={14} />
            Doorlopend
          </button>
        </div>
        <p className="text-xs text-text-dim">Cadensen en retainers die nooit "klaar" zijn. Doen niet mee in de ICE-score.</p>
        <div className="rounded-xl border border-border bg-surface/30 overflow-hidden">
          {filteredRecurring.length > 0
            ? filteredRecurring.map(renderParkedRow)
            : <p className="py-8 text-center text-sm text-text-dim">Geen doorlopende verplichtingen</p>}
        </div>
      </section>

      {/* ─── Wachtend / geblokkeerd ─── */}
      {waitingItems.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold flex items-center gap-2">
              <PauseCircle size={15} className="text-amber-400" />
              Wachtend / geblokkeerd
              <span className="rounded-full bg-surface-light px-2 py-0.5 text-xs font-normal text-text-dim">{waitingItems.length}</span>
            </h2>
          </div>
          <p className="text-xs text-text-dim">Geparkeerd: wacht op iets externs. Geen actieve prioriteit tot het gedeblokkeerd is.</p>
          <div className="rounded-xl border border-border bg-surface/30 overflow-hidden">
            {filteredWaiting.length > 0
              ? filteredWaiting.map(renderParkedRow)
              : <p className="py-8 text-center text-sm text-text-dim">Niets gevonden</p>}
          </div>
        </section>
      )}

      {/* Add/Edit Dialog */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDialogOpen(false)} />
          <div className="relative z-10 w-full max-w-lg rounded-2xl border border-border bg-surface shadow-2xl shadow-black/30 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="font-display text-lg font-semibold">{editingItem ? 'Item bewerken' : 'Nieuw item'}</h2>
              <button onClick={() => setDialogOpen(false)} className="rounded-lg p-1.5 text-text-muted hover:bg-surface-light">
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
                      ? 'Doorlopende verplichting: doet niet mee in de ICE-score.'
                      : 'Geblokkeerd/wachtend op extern: geparkeerd, geen actieve prioriteit.'}
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
                <button type="button" onClick={() => setDialogOpen(false)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-muted hover:bg-surface-light">
                  Annuleren
                </button>
                <button type="submit" disabled={!form.title} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-midnight hover:bg-primary-hover disabled:opacity-50">
                  {editingItem ? 'Opslaan' : 'Toevoegen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
