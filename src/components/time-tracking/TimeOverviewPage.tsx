import { useState, useMemo, useRef } from 'react'
import { Clock, ChevronDown, ChevronRight, Trash2, Download, Search, X } from 'lucide-react'
import { useAllTimeEntries, useDeleteTimeEntry, useUpdateTimeEntry } from '@/hooks/useTimeTracking'
import { formatDuration, cn } from '@/lib/utils'
import { exportTimeEntriesCSV } from '@/lib/csv'

type Preset = 'this_week' | 'this_month' | 'last_month' | 'custom'
type MinDuration = 0 | 15 | 30 | 60

function getDateRange(preset: Preset): { from: string; to: string } {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()

  switch (preset) {
    case 'this_week': {
      const d = new Date(now)
      const day = d.getDay()
      const diff = day === 0 ? 6 : day - 1
      d.setDate(d.getDate() - diff)
      return { from: fmt(d), to: fmt(now) }
    }
    case 'this_month':
      return { from: `${y}-${pad(m + 1)}-01`, to: fmt(now) }
    case 'last_month': {
      const start = new Date(y, m - 1, 1)
      const end = new Date(y, m, 0)
      return { from: fmt(start), to: fmt(end) }
    }
    default:
      return { from: '', to: '' }
  }
}

function fmt(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
function pad(n: number) { return String(n).padStart(2, '0') }

export function TimeOverviewPage() {
  const [preset, setPreset] = useState<Preset>('this_month')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [expandedContacts, setExpandedContacts] = useState<Set<string>>(new Set())

  // Filters
  const [contactFilter, setContactFilter] = useState('')
  const [noteSearch, setNoteSearch] = useState('')
  const [minDuration, setMinDuration] = useState<MinDuration>(0)

  // Inline note editing
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editingNoteValue, setEditingNoteValue] = useState('')
  const noteInputRef = useRef<HTMLInputElement>(null)

  const range = preset === 'custom'
    ? { from: customFrom || undefined, to: customTo || undefined }
    : (() => { const r = getDateRange(preset); return { from: r.from, to: r.to } })()

  const { data: entries = [] } = useAllTimeEntries(range as { from?: string; to?: string })
  const deleteEntry = useDeleteTimeEntry()
  const updateEntry = useUpdateTimeEntry()

  // Contact options for dropdown (from current period data)
  const contactOptions = useMemo(() => {
    const seen = new Map<string, string>()
    for (const e of entries) {
      if (!seen.has(e.contact_id)) seen.set(e.contact_id, (e as any).contact_name || 'Unknown')
    }
    return Array.from(seen.entries()).sort(([, a], [, b]) => a.localeCompare(b))
  }, [entries])

  // Client-side filters
  const filteredEntries = useMemo(() => {
    return entries.filter(e => {
      if (contactFilter && e.contact_id !== contactFilter) return false
      if (minDuration > 0 && e.duration_minutes < minDuration) return false
      if (noteSearch && !e.description?.toLowerCase().includes(noteSearch.toLowerCase())) return false
      return true
    })
  }, [entries, contactFilter, minDuration, noteSearch])

  // Group by contact
  const grouped = useMemo(() => {
    const map = new Map<string, { name: string; company: string; totalMinutes: number; entries: typeof filteredEntries }>()
    for (const entry of filteredEntries) {
      const key = entry.contact_id
      if (!map.has(key)) {
        map.set(key, {
          name: (entry as any).contact_name || 'Unknown',
          company: (entry as any).contact_company || '',
          totalMinutes: 0,
          entries: [],
        })
      }
      const group = map.get(key)!
      group.totalMinutes += entry.duration_minutes
      group.entries.push(entry)
    }
    return Array.from(map.entries())
      .sort(([, a], [, b]) => b.totalMinutes - a.totalMinutes)
  }, [filteredEntries])

  const totalMinutes = filteredEntries.reduce((sum, e) => sum + e.duration_minutes, 0)
  const uniqueContacts = new Set(filteredEntries.map(e => e.contact_id)).size

  const daysInRange = useMemo(() => {
    if (!range.from || !range.to) return 1
    const from = new Date(range.from)
    const to = new Date(range.to)
    return Math.max(1, Math.ceil((to.getTime() - from.getTime()) / 86400000) + 1)
  }, [range])

  const toggleContact = (id: string) => {
    setExpandedContacts(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const startEditNote = (id: string, current: string | null) => {
    setEditingNoteId(id)
    setEditingNoteValue(current ?? '')
    setTimeout(() => noteInputRef.current?.focus(), 0)
  }

  const saveNote = (id: string) => {
    updateEntry.mutate({ id, description: editingNoteValue.trim() || null })
    setEditingNoteId(null)
  }

  const cancelNote = () => setEditingNoteId(null)

  const hasFilters = contactFilter || noteSearch || minDuration > 0
  const clearFilters = () => { setContactFilter(''); setNoteSearch(''); setMinDuration(0) }

  const presets: { key: Preset; label: string }[] = [
    { key: 'this_week', label: 'Deze week' },
    { key: 'this_month', label: 'Deze maand' },
    { key: 'last_month', label: 'Vorige maand' },
    { key: 'custom', label: 'Custom' },
  ]

  const minDurationOptions: { value: MinDuration; label: string }[] = [
    { value: 0, label: 'Alle' },
    { value: 15, label: '>15m' },
    { value: 30, label: '>30m' },
    { value: 60, label: '>1u' },
  ]

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-main font-[family-name:var(--font-display)]">
            Time Tracking
          </h1>
          <p className="text-sm text-text-dim mt-1">Overzicht van alle bijgehouden uren</p>
        </div>
        {filteredEntries.length > 0 && (
          <button
            onClick={() => exportTimeEntriesCSV(filteredEntries)}
            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-[13px] font-medium text-text-muted hover:bg-surface-light transition-colors"
          >
            <Download size={14} />
            Export
          </button>
        )}
      </div>

      {/* Periode filter */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {presets.map(p => (
          <button
            key={p.key}
            onClick={() => setPreset(p.key)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors',
              preset === p.key
                ? 'bg-primary/20 text-primary'
                : 'bg-surface-light text-text-muted hover:text-text-main'
            )}
          >
            {p.label}
          </button>
        ))}
        {preset === 'custom' && (
          <div className="flex items-center gap-2 ml-2">
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="bg-surface-light border border-border rounded-md px-3 py-1.5 text-[13px] text-text-main focus:border-primary focus:outline-none"
            />
            <span className="text-text-dim text-[12px]">t/m</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="bg-surface-light border border-border rounded-md px-3 py-1.5 text-[13px] text-text-main focus:border-primary focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* Extra filters row */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {/* Contact filter */}
        {contactOptions.length > 1 && (
          <select
            value={contactFilter}
            onChange={e => setContactFilter(e.target.value)}
            className={cn(
              'bg-surface-light border rounded-lg px-3 py-1.5 text-[13px] focus:outline-none focus:border-primary transition-colors',
              contactFilter ? 'border-primary text-text-main' : 'border-border text-text-muted'
            )}
          >
            <option value="">Alle klanten</option>
            {contactOptions.map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
        )}

        {/* Min duration */}
        <div className="flex items-center gap-1 bg-surface-light rounded-lg border border-border p-0.5">
          {minDurationOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setMinDuration(opt.value)}
              className={cn(
                'px-2.5 py-1 rounded-md text-[12px] font-medium transition-colors',
                minDuration === opt.value
                  ? 'bg-primary/20 text-primary'
                  : 'text-text-muted hover:text-text-main'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Note search */}
        <div className="relative flex items-center">
          <Search size={12} className="absolute left-2.5 text-text-dim pointer-events-none" />
          <input
            type="text"
            placeholder="Zoek in notities…"
            value={noteSearch}
            onChange={e => setNoteSearch(e.target.value)}
            className={cn(
              'bg-surface-light border rounded-lg pl-7 pr-3 py-1.5 text-[13px] focus:outline-none focus:border-primary transition-colors w-44',
              noteSearch ? 'border-primary text-text-main' : 'border-border text-text-muted'
            )}
          />
          {noteSearch && (
            <button onClick={() => setNoteSearch('')} className="absolute right-2 text-text-dim hover:text-text-main">
              <X size={11} />
            </button>
          )}
        </div>

        {/* Clear all filters */}
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 px-2.5 py-1.5 text-[12px] text-text-dim hover:text-danger transition-colors"
          >
            <X size={11} />
            Filters wissen
          </button>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-surface rounded-xl border border-border p-5">
          <div className="text-[11px] font-medium text-text-dim uppercase tracking-wider mb-1">Totaal uren</div>
          <div className="text-2xl font-bold text-primary">{formatDuration(totalMinutes)}</div>
        </div>
        <div className="bg-surface rounded-xl border border-border p-5">
          <div className="text-[11px] font-medium text-text-dim uppercase tracking-wider mb-1">Gem. per dag</div>
          <div className="text-2xl font-bold text-text-main">{formatDuration(Math.round(totalMinutes / daysInRange))}</div>
        </div>
        <div className="bg-surface rounded-xl border border-border p-5">
          <div className="text-[11px] font-medium text-text-dim uppercase tracking-wider mb-1">Contacten</div>
          <div className="text-2xl font-bold text-text-main">{uniqueContacts}</div>
        </div>
      </div>

      {/* Contact breakdown */}
      {grouped.length === 0 ? (
        <div className="text-center py-16">
          <Clock size={32} className="mx-auto text-text-dim mb-3" />
          <p className="text-sm text-text-dim">Geen tijdregistraties gevonden in deze periode</p>
        </div>
      ) : (
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          {grouped.map(([contactId, group]) => {
            const isExpanded = expandedContacts.has(contactId)
            return (
              <div key={contactId} className="border-b border-border/40 last:border-b-0">
                <button
                  onClick={() => toggleContact(contactId)}
                  className="flex items-center w-full px-5 py-3.5 hover:bg-surface-light/40 transition-colors"
                >
                  <span className="text-text-dim mr-2">
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </span>
                  <div className="flex-1 text-left">
                    <span className="text-[13px] font-medium text-text-main">{group.name}</span>
                    {group.company && (
                      <span className="text-[12px] text-text-dim ml-2">{group.company}</span>
                    )}
                  </div>
                  <span className="text-[13px] font-semibold text-text-muted ml-4">
                    {group.entries.length} entries
                  </span>
                  <span className="text-[14px] font-bold text-primary ml-6 min-w-[70px] text-right">
                    {formatDuration(group.totalMinutes)}
                  </span>
                </button>

                {isExpanded && (() => {
                  const byDay = new Map<string, { total: number; entries: typeof group.entries; date: Date }>()
                  for (const entry of group.entries) {
                    const d = new Date(entry.started_at || entry.created_at)
                    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
                    if (!byDay.has(key)) byDay.set(key, { total: 0, entries: [], date: d })
                    const bucket = byDay.get(key)!
                    bucket.total += entry.duration_minutes
                    bucket.entries.push(entry)
                  }
                  const days = Array.from(byDay.values()).sort((a, b) => b.date.getTime() - a.date.getTime())
                  return (
                    <div className="px-5 pb-3">
                      {days.map((day, idx) => {
                        const hasMultiple = day.entries.length > 1
                        return (
                          <div key={idx}>
                            {hasMultiple && (
                              <div className="flex items-center gap-3 pt-2.5 pb-1 pl-6 text-[11px] border-t border-border/20">
                                <span className="uppercase tracking-wider font-semibold text-text-dim">
                                  {day.date.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })}
                                </span>
                                <div className="flex-1 h-px bg-border/30" />
                                <span className="text-[11px] font-semibold text-primary/80">
                                  {formatDuration(day.total)} totaal
                                </span>
                              </div>
                            )}
                            {day.entries.map((entry) => (
                              <div
                                key={entry.id}
                                className={cn(
                                  'group flex items-center gap-3 py-2 pl-6 text-[12px]',
                                  !hasMultiple && 'border-t border-border/20'
                                )}
                              >
                                <Clock size={11} className="text-text-dim shrink-0" />
                                <span className="text-text-muted font-medium min-w-[60px]">
                                  {formatDuration(entry.duration_minutes)}
                                </span>
                                {!hasMultiple && (
                                  <span className="text-text-dim">
                                    {new Date(entry.created_at).toLocaleDateString('nl-NL', {
                                      weekday: 'short', day: 'numeric', month: 'short',
                                    })}
                                  </span>
                                )}
                                {entry.started_at && entry.ended_at && (
                                  <span className="text-text-dim">
                                    {new Date(entry.started_at).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                                    {' — '}
                                    {new Date(entry.ended_at).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                )}

                                {/* Inline note editing */}
                                {editingNoteId === entry.id ? (
                                  <input
                                    ref={noteInputRef}
                                    value={editingNoteValue}
                                    onChange={e => setEditingNoteValue(e.target.value)}
                                    onBlur={() => saveNote(entry.id)}
                                    onKeyDown={e => {
                                      if (e.key === 'Enter') saveNote(entry.id)
                                      if (e.key === 'Escape') cancelNote()
                                    }}
                                    placeholder="Notitie…"
                                    className="flex-1 bg-surface border border-primary/50 rounded px-2 py-0.5 text-[12px] text-text-main focus:outline-none focus:border-primary min-w-0"
                                  />
                                ) : (
                                  <span
                                    onClick={() => startEditNote(entry.id, entry.description)}
                                    className={cn(
                                      'truncate cursor-text hover:text-text-main transition-colors',
                                      entry.description ? 'text-text-dim' : 'text-text-dim/40 italic'
                                    )}
                                    title="Klik om notitie te bewerken"
                                  >
                                    {entry.description || 'Notitie toevoegen…'}
                                  </span>
                                )}

                                <div className="flex-1" />
                                <button
                                  onClick={() => deleteEntry.mutate(entry.id)}
                                  className="opacity-0 group-hover:opacity-100 text-text-dim hover:text-danger transition-all shrink-0"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )
                      })}
                    </div>
                  )
                })()}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
