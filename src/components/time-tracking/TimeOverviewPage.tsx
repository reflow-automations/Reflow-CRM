import { useState, useMemo } from 'react'
import { Clock, ChevronDown, ChevronRight, Trash2 } from 'lucide-react'
import { useAllTimeEntries, useDeleteTimeEntry } from '@/hooks/useTimeTracking'
import { formatDuration, cn } from '@/lib/utils'

type Preset = 'this_week' | 'this_month' | 'last_month' | 'custom'

function getDateRange(preset: Preset): { from: string; to: string } {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()

  switch (preset) {
    case 'this_week': {
      const d = new Date(now)
      const day = d.getDay()
      const diff = day === 0 ? 6 : day - 1 // Monday start
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

  const range = preset === 'custom'
    ? { from: customFrom || undefined, to: customTo || undefined }
    : (() => { const r = getDateRange(preset); return { from: r.from, to: r.to } })()

  const { data: entries = [] } = useAllTimeEntries(range as { from?: string; to?: string })
  const deleteEntry = useDeleteTimeEntry()

  // Group by contact
  const grouped = useMemo(() => {
    const map = new Map<string, { name: string; company: string; totalMinutes: number; entries: typeof entries }>()
    for (const entry of entries) {
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
  }, [entries])

  const totalMinutes = entries.reduce((sum, e) => sum + e.duration_minutes, 0)
  const uniqueContacts = new Set(entries.map(e => e.contact_id)).size

  // Days in range for average
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

  const presets: { key: Preset; label: string }[] = [
    { key: 'this_week', label: 'Deze week' },
    { key: 'this_month', label: 'Deze maand' },
    { key: 'last_month', label: 'Vorige maand' },
    { key: 'custom', label: 'Custom' },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-main font-[family-name:var(--font-display)]">
          Time Tracking
        </h1>
        <p className="text-sm text-text-dim mt-1">Overzicht van alle bijgehouden uren</p>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
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

                {isExpanded && (
                  <div className="px-5 pb-3">
                    {group.entries.map((entry) => (
                      <div
                        key={entry.id}
                        className="group flex items-center gap-3 py-2 pl-6 text-[12px] border-t border-border/20"
                      >
                        <Clock size={11} className="text-text-dim shrink-0" />
                        <span className="text-text-muted font-medium min-w-[60px]">
                          {formatDuration(entry.duration_minutes)}
                        </span>
                        <span className="text-text-dim">
                          {new Date(entry.created_at).toLocaleDateString('nl-NL', {
                            weekday: 'short', day: 'numeric', month: 'short',
                          })}
                        </span>
                        {entry.started_at && entry.ended_at && (
                          <span className="text-text-dim">
                            {new Date(entry.started_at).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                            {' — '}
                            {new Date(entry.ended_at).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                        {entry.description && (
                          <span className="text-text-dim truncate">{entry.description}</span>
                        )}
                        <div className="flex-1" />
                        <button
                          onClick={() => deleteEntry.mutate(entry.id)}
                          className="opacity-0 group-hover:opacity-100 text-text-dim hover:text-danger transition-all"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
