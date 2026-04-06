import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, Lightbulb, CheckSquare, Clock, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { useContacts } from '@/hooks/useContacts'
import { isBefore, startOfDay } from 'date-fns'

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/crm', icon: Users, label: 'CRM' },
  { to: '/ice', icon: Lightbulb, label: 'ICE Board' },
  { to: '/tasks', icon: CheckSquare, label: 'Google Tasks' },
  { to: '/time', icon: Clock, label: 'Time Tracking' },
]

export function Sidebar() {
  const { signOut, user } = useAuth()
  const { data: contacts } = useContacts()

  const overdueCount = contacts?.filter(c =>
    c.next_follow_up && isBefore(new Date(c.next_follow_up), startOfDay(new Date()))
  ).length ?? 0

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border bg-surface" style={{ width: '240px' }}>
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-border px-6 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
          <span className="font-display text-base font-bold text-midnight">R</span>
        </div>
        <span className="font-display text-lg font-bold tracking-tight text-text-main">
          CRM Reflow
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-4 py-5">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-4 py-3 text-[14px] font-medium transition-colors',
                isActive
                  ? 'bg-primary/12 text-primary-light'
                  : 'text-text-muted hover:bg-surface-light hover:text-text-main'
              )
            }
          >
            <Icon size={18} />
            <span className="flex-1">{label}</span>
            {to === '/crm' && overdueCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-[11px] font-bold text-white">
                {overdueCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User + Sign out */}
      <div className="border-t border-border px-4 py-3">
        <button
          onClick={() => signOut()}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-[13px] text-text-muted transition-colors hover:bg-surface-light hover:text-text-main"
        >
          <LogOut size={16} />
          <span className="flex-1 truncate text-left">{user?.email ?? 'Uitloggen'}</span>
        </button>
      </div>

      {/* Branding */}
      <div className="border-t border-border px-6 py-4">
        <p className="text-[10px] uppercase tracking-widest text-text-dim">Reflow Automations</p>
      </div>
    </aside>
  )
}
