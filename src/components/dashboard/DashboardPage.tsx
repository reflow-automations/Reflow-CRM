import { useNavigate } from 'react-router-dom'
import { Users, CalendarClock, Lightbulb, TrendingUp, Euro } from 'lucide-react'
import { useContacts } from '@/hooks/useContacts'
import { useICEItems } from '@/hooks/useICEItems'
import { STATUS_CONFIG, type ContactStatus } from '@/lib/constants'
import { isOverdue, isDueToday, formatRelativeDate, cn } from '@/lib/utils'

export function DashboardPage() {
  const { data: contacts = [] } = useContacts()
  const { data: iceItems = [] } = useICEItems()
  const navigate = useNavigate()

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

  const goToContact = (contactId: string) => {
    navigate(`/crm?contact=${contactId}`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-text-muted">Overzicht van je CRM en prioriteiten</p>
      </div>

      {/* Stats cards */}
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
          {wonValue > 0 && (
            <p className="text-[11px] text-text-dim mt-1">Won: {formatEuro(wonValue)}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Upcoming follow-ups */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="font-display text-base font-semibold mb-4 flex items-center gap-2">
            <CalendarClock size={16} className="text-primary" />
            Aankomende opvolgingen
          </h3>
          {upcomingFollowUps.length === 0 ? (
            <p className="text-sm text-text-dim py-4 text-center">Geen aankomende opvolgingen</p>
          ) : (
            <div className="space-y-2">
              {upcomingFollowUps.map((contact) => (
                <div
                  key={contact.id}
                  onClick={() => goToContact(contact.id)}
                  className="flex items-center justify-between rounded-lg bg-surface-light px-3 py-2 cursor-pointer hover:bg-surface-hover transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className={cn('h-2.5 w-2.5 rounded-full shrink-0', STATUS_CONFIG[contact.status]?.dotColor)} />
                    <div>
                      <p className="text-sm font-medium text-text-main">{contact.name}</p>
                      <p className="text-[11px] text-text-dim">{contact.company}</p>
                    </div>
                  </div>
                  <span className={cn('text-xs', isDueToday(contact.next_follow_up) ? 'text-yellow-400 font-medium' : 'text-text-muted')}>{formatRelativeDate(contact.next_follow_up)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Overdue section */}
          {overdueContacts.length > 0 && (
            <>
              <h4 className="font-display text-sm font-semibold mt-5 mb-3 text-danger flex items-center gap-2">
                Overdue ({overdueContacts.length})
              </h4>
              <div className="space-y-2">
                {overdueContacts.slice(0, 5).map((contact) => (
                  <div
                    key={contact.id}
                    onClick={() => goToContact(contact.id)}
                    className="flex items-center justify-between rounded-lg border border-danger/20 bg-danger-muted px-3 py-2 cursor-pointer hover:bg-danger/15 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className={cn('h-2.5 w-2.5 rounded-full shrink-0', STATUS_CONFIG[contact.status]?.dotColor)} />
                      <p className="text-sm font-medium text-text-main">{contact.name}</p>
                    </div>
                    <span className="text-xs text-danger font-medium">{formatRelativeDate(contact.next_follow_up)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Top ICE items */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="font-display text-base font-semibold mb-4 flex items-center gap-2">
            <Lightbulb size={16} className="text-accent" />
            Top prioriteiten (ICE)
          </h3>
          {topICEItems.length === 0 ? (
            <p className="text-sm text-text-dim py-4 text-center">Nog geen ICE items</p>
          ) : (
            <div className="space-y-2">
              {topICEItems.map((item, index) => (
                <div key={item.id} className="flex items-center gap-3 rounded-lg bg-surface-light px-3 py-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent/15 text-xs font-bold text-accent">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-text-main">{item.title}</p>
                  </div>
                  <span className={cn(
                    'rounded-md px-2 py-0.5 text-xs font-bold',
                    item.priority_score >= 7 ? 'bg-green-500/15 text-green-400' :
                    item.priority_score >= 4 ? 'bg-accent/15 text-accent' :
                    'bg-surface-hover text-text-dim'
                  )}>
                    {item.priority_score}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Pipeline summary */}
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
                    <div
                      className={cn('h-full rounded-full transition-all', config.dotColor)}
                      style={{ width: `${pct}%` }}
                    />
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
