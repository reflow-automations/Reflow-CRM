import { useState } from 'react'
import {
  Users, CalendarClock, Lightbulb, TrendingUp, Euro,
  LayoutDashboard, CheckSquare, Clock, List, LayoutGrid,
  Calendar, Flag, Building2, Search, Plus, Download,
} from 'lucide-react'
import { STATUS_CONFIG, PRIORITY_CONFIG, SOURCE_CONFIG, STATUS_ORDER, type ContactStatus, type ContactSource } from '@/lib/constants'
import { isOverdue, formatRelativeDate, cn } from '@/lib/utils'
import { DEMO_CONTACTS, DEMO_ICE_ITEMS } from './demoData'
import type { Contact } from '@/types/contacts'

type DemoView = 'dashboard' | 'crm'
type CRMView = 'list' | 'board'

function SourceBadge({ source }: { source: ContactSource }) {
  const config = SOURCE_CONFIG[source]
  return (
    <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium', config.bgColor)}>
      {config.label}
    </span>
  )
}

function DemoContactCard({ contact }: { contact: Contact }) {
  const priorityConfig = PRIORITY_CONFIG[contact.priority]
  const overdue = isOverdue(contact.next_follow_up)
  return (
    <div className="rounded-lg border border-border/60 bg-surface-light p-3 transition-all hover:border-border-light">
      <div className="flex items-start justify-between mb-1.5">
        <p className="text-[13px] font-medium text-text-main leading-tight">{contact.name}</p>
        <Flag size={11} fill={priorityConfig.iconColor} color={priorityConfig.iconColor} className="shrink-0 mt-0.5" />
      </div>
      {contact.company && (
        <p className="flex items-center gap-1 text-[11px] text-text-dim mb-2">
          <Building2 size={10} className="shrink-0" />
          {contact.company}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-1.5">
        <SourceBadge source={contact.source} />
        {contact.next_follow_up && (
          <span className={cn(
            'flex items-center gap-1 rounded-full bg-surface px-2 py-0.5 text-[10px]',
            overdue ? 'text-danger font-medium' : 'text-text-dim'
          )}>
            <Calendar size={9} />
            {formatRelativeDate(contact.next_follow_up)}
          </span>
        )}
      </div>
    </div>
  )
}

function DemoBoardView({ contacts }: { contacts: Contact[] }) {
  const grouped = STATUS_ORDER.reduce<Record<ContactStatus, Contact[]>>((acc, status) => {
    acc[status] = contacts.filter((c) => c.status === status)
    return acc
  }, {} as Record<ContactStatus, Contact[]>)

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {STATUS_ORDER.map((status) => {
        const config = STATUS_CONFIG[status]
        const cols = grouped[status]
        return (
          <div key={status} className="flex w-72 shrink-0 flex-col rounded-xl border border-border bg-surface/50">
            <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className={cn('h-2.5 w-2.5 rounded-full', config.dotColor)} />
                <span className={cn('text-sm font-semibold uppercase tracking-wider', config.color)}>
                  {config.label}
                </span>
                <span className="rounded-full bg-surface-light px-2 py-0.5 text-xs text-text-dim">{cols.length}</span>
              </div>
              <div className="rounded-md p-1 text-text-dim">
                <Plus size={16} />
              </div>
            </div>
            <div className="flex-1 space-y-2 p-3 min-h-[120px]">
              {cols.map((contact) => (
                <DemoContactCard key={contact.id} contact={contact} />
              ))}
              {cols.length === 0 && (
                <div className="flex items-center justify-center py-8">
                  <span className="text-xs text-text-dim">Geen contacten</span>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function DemoListView({ contacts }: { contacts: Contact[] }) {
  const formatEuro = (value: number) =>
    new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)

  // Group by status
  const grouped = STATUS_ORDER.map((status) => ({
    status,
    config: STATUS_CONFIG[status],
    contacts: contacts.filter((c) => c.status === status),
  })).filter((g) => g.contacts.length > 0)

  return (
    <div className="rounded-xl border border-border bg-surface/50 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-surface-light/50">
            <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-text-dim">Naam</th>
            <th className="px-3 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-text-dim">Bedrijf</th>
            <th className="px-3 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-text-dim">Prioriteit</th>
            <th className="px-3 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-text-dim">Bron</th>
            <th className="px-3 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-text-dim">Follow-up</th>
            <th className="px-3 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-text-dim">Email</th>
            <th className="px-3 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-text-dim">Deal</th>
          </tr>
        </thead>
        <tbody>
          {grouped.map(({ status, config, contacts: groupContacts }) => (
            <>
              <tr key={status} className="bg-surface-light/30">
                <td colSpan={7} className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <span className={cn('h-2.5 w-2.5 rounded-full', config.dotColor)} />
                    <span className={cn('text-xs font-semibold uppercase tracking-wider', config.color)}>
                      {config.label}
                    </span>
                    <span className="text-[10px] text-text-dim">{groupContacts.length}</span>
                  </div>
                </td>
              </tr>
              {groupContacts.map((contact) => (
                <tr key={contact.id} className="border-b border-border/20 hover:bg-surface-light/30 transition-colors">
                  <td className="px-4 py-2.5">
                    <p className="text-[13px] font-medium text-text-main">{contact.name}</p>
                  </td>
                  <td className="px-3 py-2.5 text-[13px] text-text-muted">{contact.company}</td>
                  <td className="px-3 py-2.5">
                    <span className={cn('text-xs font-medium', PRIORITY_CONFIG[contact.priority].color)}>
                      {PRIORITY_CONFIG[contact.priority].label}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <SourceBadge source={contact.source} />
                  </td>
                  <td className="px-3 py-2.5">
                    {contact.next_follow_up ? (
                      <span className={cn('text-xs', isOverdue(contact.next_follow_up) ? 'text-danger font-medium' : 'text-text-muted')}>
                        {formatRelativeDate(contact.next_follow_up)}
                      </span>
                    ) : (
                      <span className="text-xs text-text-dim">-</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-[12px] text-text-dim">{contact.email || '-'}</td>
                  <td className="px-3 py-2.5 text-right">
                    {contact.deal_value ? (
                      <span className="text-[13px] font-medium text-text-main">{formatEuro(contact.deal_value)}</span>
                    ) : (
                      <span className="text-xs text-text-dim">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function DemoPage() {
  const [activeView, setActiveView] = useState<DemoView>('dashboard')
  const [crmView, setCrmView] = useState<CRMView>('board')
  const contacts = DEMO_CONTACTS
  const iceItems = DEMO_ICE_ITEMS

  const overdueContacts = contacts.filter((c) => isOverdue(c.next_follow_up))

  const NAV_ITEMS: { icon: typeof LayoutDashboard; label: string; view: DemoView }[] = [
    { icon: LayoutDashboard, label: 'Dashboard', view: 'dashboard' },
    { icon: Users, label: 'CRM', view: 'crm' },
  ]
  const STATIC_NAV = [
    { icon: Lightbulb, label: 'ICE Board' },
    { icon: CheckSquare, label: 'Google Tasks' },
    { icon: Clock, label: 'Time Tracking' },
  ]

  return (
    <div className="min-h-screen bg-midnight text-slate-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border bg-surface" style={{ width: '240px' }}>
        <div className="flex items-center gap-3 border-b border-border px-6 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
            <span className="font-display text-base font-bold text-midnight">R</span>
          </div>
          <span className="font-display text-lg font-bold tracking-tight text-text-main">CRM Reflow</span>
        </div>
        <nav className="flex-1 space-y-1 px-4 py-5">
          {NAV_ITEMS.map(({ icon: Icon, label, view }) => (
            <button
              key={label}
              onClick={() => setActiveView(view)}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg px-4 py-3 text-[14px] font-medium transition-colors',
                activeView === view ? 'bg-primary/12 text-primary-light' : 'text-text-muted hover:bg-surface-light hover:text-text-main'
              )}
            >
              <Icon size={18} />
              <span className="flex-1 text-left">{label}</span>
              {view === 'crm' && overdueContacts.length > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-[11px] font-bold text-white">
                  {overdueContacts.length}
                </span>
              )}
            </button>
          ))}
          {STATIC_NAV.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-3 rounded-lg px-4 py-3 text-[14px] font-medium text-text-muted">
              <Icon size={18} />
              <span className="flex-1">{label}</span>
            </div>
          ))}
        </nav>
        <div className="border-t border-border px-6 py-4">
          <p className="text-[10px] uppercase tracking-widest text-text-dim">Reflow Automations</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="min-w-0 overflow-x-auto" style={{ marginLeft: '240px', padding: '28px 36px' }}>
        {activeView === 'dashboard' && <DemoDashboard contacts={contacts} iceItems={iceItems} />}
        {activeView === 'crm' && <DemoCRM contacts={contacts} crmView={crmView} setCrmView={setCrmView} />}
      </main>
    </div>
  )
}

/* ─── Dashboard ─── */
function DemoDashboard({ contacts, iceItems }: { contacts: Contact[]; iceItems: typeof DEMO_ICE_ITEMS }) {
  const statusCounts = contacts.reduce<Record<ContactStatus, number>>((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1
    return acc
  }, {} as Record<ContactStatus, number>)

  const overdueContacts = contacts.filter((c) => isOverdue(c.next_follow_up))
  const upcomingFollowUps = contacts
    .filter((c) => c.next_follow_up && !isOverdue(c.next_follow_up))
    .sort((a, b) => new Date(a.next_follow_up!).getTime() - new Date(b.next_follow_up!).getTime())
    .slice(0, 8)
  const topICEItems = iceItems.filter((i) => i.status !== 'done').slice(0, 5)

  const pipelineValue = contacts
    .filter((c) => c.status === 'negotiation' || c.status === 'contacted')
    .reduce((sum, c) => sum + (c.deal_value ?? 0), 0)
  const wonValue = contacts
    .filter((c) => c.status === 'won')
    .reduce((sum, c) => sum + (c.deal_value ?? 0), 0)

  const formatEuro = (value: number) =>
    new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-text-muted">Overzicht van je CRM en prioriteiten</p>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-lg bg-primary/15 p-2"><Users size={18} className="text-primary" /></div>
            <span className="text-sm text-text-muted">Contacten</span>
          </div>
          <p className="font-display text-3xl font-bold">{contacts.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-lg bg-green-500/15 p-2"><TrendingUp size={18} className="text-green-400" /></div>
            <span className="text-sm text-text-muted">Won</span>
          </div>
          <p className="font-display text-3xl font-bold text-green-400">{statusCounts.won || 0}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-lg bg-orange-500/15 p-2"><CalendarClock size={18} className="text-orange-400" /></div>
            <span className="text-sm text-text-muted">Negotiation</span>
          </div>
          <p className="font-display text-3xl font-bold text-orange-400">{statusCounts.negotiation || 0}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-lg bg-danger-muted p-2"><CalendarClock size={18} className="text-danger" /></div>
            <span className="text-sm text-text-muted">Overdue</span>
          </div>
          <p className="font-display text-3xl font-bold text-danger">{overdueContacts.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-lg bg-green-500/15 p-2"><Euro size={18} className="text-green-400" /></div>
            <span className="text-sm text-text-muted">Pipeline</span>
          </div>
          <p className="font-display text-xl font-bold text-green-400">{formatEuro(pipelineValue)}</p>
          {wonValue > 0 && <p className="text-[11px] text-text-dim mt-1">Won: {formatEuro(wonValue)}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="font-display text-base font-semibold mb-4 flex items-center gap-2">
            <CalendarClock size={16} className="text-primary" />
            Aankomende opvolgingen
          </h3>
          <div className="space-y-2">
            {upcomingFollowUps.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-lg bg-surface-light px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className={cn('h-2.5 w-2.5 rounded-full shrink-0', STATUS_CONFIG[c.status]?.dotColor)} />
                  <div>
                    <p className="text-sm font-medium text-text-main">{c.name}</p>
                    <p className="text-[11px] text-text-dim">{c.company}</p>
                  </div>
                </div>
                <span className="text-xs text-text-muted">{formatRelativeDate(c.next_follow_up)}</span>
              </div>
            ))}
          </div>
          {overdueContacts.length > 0 && (
            <>
              <h4 className="font-display text-sm font-semibold mt-5 mb-3 text-danger">Overdue ({overdueContacts.length})</h4>
              <div className="space-y-2">
                {overdueContacts.slice(0, 5).map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded-lg border border-danger/20 bg-danger-muted px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className={cn('h-2.5 w-2.5 rounded-full shrink-0', STATUS_CONFIG[c.status]?.dotColor)} />
                      <p className="text-sm font-medium text-text-main">{c.name}</p>
                    </div>
                    <span className="text-xs text-danger font-medium">{formatRelativeDate(c.next_follow_up)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="font-display text-base font-semibold mb-4 flex items-center gap-2">
            <Lightbulb size={16} className="text-accent" />
            Top prioriteiten (ICE)
          </h3>
          <div className="space-y-2">
            {topICEItems.map((item, i) => (
              <div key={item.id} className="flex items-center gap-3 rounded-lg bg-surface-light px-3 py-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent/15 text-xs font-bold text-accent">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-text-main">{item.title}</p>
                </div>
                <span className={cn(
                  'rounded-md px-2 py-0.5 text-xs font-bold',
                  item.priority_score >= 7 ? 'bg-green-500/15 text-green-400' :
                  item.priority_score >= 4 ? 'bg-accent/15 text-accent' :
                  'bg-surface-hover text-text-dim'
                )}>{item.priority_score}</span>
              </div>
            ))}
          </div>
          <h4 className="font-display text-sm font-semibold mt-5 mb-3">Pipeline verdeling</h4>
          <div className="space-y-2">
            {(Object.entries(STATUS_CONFIG) as [ContactStatus, typeof STATUS_CONFIG[ContactStatus]][]).map(([key, config]) => {
              const count = statusCounts[key] || 0
              const pct = contacts.length > 0 ? (count / contacts.length) * 100 : 0
              return (
                <div key={key} className="flex items-center gap-3">
                  <span className={cn('h-2 w-2 rounded-full', config.dotColor)} />
                  <span className="w-28 text-xs text-text-muted">{config.label}</span>
                  <div className="flex-1 h-2 rounded-full bg-surface-light overflow-hidden">
                    <div className={cn('h-full rounded-full', config.dotColor)} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-text-dim w-8 text-right">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── CRM ─── */
function DemoCRM({ contacts, crmView, setCrmView }: { contacts: Contact[]; crmView: CRMView; setCrmView: (v: CRMView) => void }) {
  const VIEW_TABS: { key: CRMView; label: string; icon: typeof List }[] = [
    { key: 'list', label: 'List', icon: List },
    { key: 'board', label: 'Board', icon: LayoutGrid },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1 border-b border-border">
            {VIEW_TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setCrmView(key)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium transition-all border-b-2 -mb-px',
                  crmView === key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-text-dim hover:text-text-muted'
                )}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-[13px] font-medium text-text-muted">
            <Download size={14} />
            Export
          </div>
          <div className="flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-1.5 text-[13px] font-semibold text-midnight">
            <Plus size={14} />
            Task
          </div>
        </div>
      </div>

      {/* Filters (list view only) */}
      {crmView === 'list' && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-dim" />
            <input
              type="text"
              readOnly
              placeholder="Zoek op naam, bedrijf, email..."
              className="w-full rounded-lg border border-border bg-surface-light pl-10 pr-4 py-2.5 text-[13px] text-text-main placeholder:text-text-dim"
            />
          </div>
          <select disabled className="rounded-lg border border-border bg-surface-light px-3.5 py-2.5 text-[13px] text-text-muted">
            <option>Alle statussen</option>
          </select>
          <select disabled className="rounded-lg border border-border bg-surface-light px-3.5 py-2.5 text-[13px] text-text-muted">
            <option>Alle prioriteiten</option>
          </select>
          <select disabled className="rounded-lg border border-border bg-surface-light px-3.5 py-2.5 text-[13px] text-text-muted">
            <option>Alle bronnen</option>
          </select>
        </div>
      )}

      {crmView === 'board' && <DemoBoardView contacts={contacts} />}
      {crmView === 'list' && <DemoListView contacts={contacts} />}
    </div>
  )
}
