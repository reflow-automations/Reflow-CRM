import { useState, useEffect } from 'react'
import { Plus, List, LayoutGrid, Calendar, Loader2 } from 'lucide-react'
import { useContacts } from '@/hooks/useContacts'
import type { Contact } from '@/types/contacts'
import type { ContactStatus } from '@/lib/constants'
import { ContactFilters } from './ContactFilters'
import { ContactDialog } from './ContactDialog'
import { ContactDetailPanel } from './ContactDetailPanel'
import { ListView } from './list-view/ListView'
import { BoardView } from './board-view/BoardView'
import { CalendarView } from './calendar-view/CalendarView'
import { useDeleteContact } from '@/hooks/useContacts'
import { cn } from '@/lib/utils'

type ViewMode = 'list' | 'board' | 'calendar'

export type SortField = 'name' | 'company' | 'next_follow_up' | 'priority' | 'source'
export type SortDir = 'asc' | 'desc'
export interface SortEntry { field: SortField; dir: SortDir }

const PRIORITY_ORDER: Record<string, number> = { high: 0, normal: 1, low: 2 }

const SORT_STORAGE_KEY = 'crm-sort-order'

function loadSorts(): SortEntry[] {
  try {
    const stored = localStorage.getItem(SORT_STORAGE_KEY)
    if (stored) return JSON.parse(stored)
  } catch {}
  return []
}

const VIEW_TABS: { key: ViewMode; label: string; icon: typeof List }[] = [
  { key: 'list', label: 'List', icon: List },
  { key: 'board', label: 'Board', icon: LayoutGrid },
  { key: 'calendar', label: 'Calendar', icon: Calendar },
]

export function CRMPage() {
  const { data: contacts = [], isLoading } = useContacts()
  const deleteContact = useDeleteContact()

  const [view, setView] = useState<ViewMode>('list')
  const [filter, setFilter] = useState({
    search: '',
    status: 'all' as ContactStatus | 'all',
    priority: 'all',
    source: 'all',
  })
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [defaultStatus, setDefaultStatus] = useState<ContactStatus>('contacted')
  const [sorts, setSorts] = useState<SortEntry[]>(loadSorts)

  useEffect(() => {
    localStorage.setItem(SORT_STORAGE_KEY, JSON.stringify(sorts))
  }, [sorts])

  const handleToggleSort = (field: SortField) => {
    setSorts((prev) => {
      const idx = prev.findIndex((s) => s.field === field)
      if (idx === -1) {
        // Add as new sort (max 2)
        const next = [...prev, { field, dir: 'asc' as SortDir }]
        return next.slice(-2)
      }
      if (prev[idx].dir === 'asc') {
        // Flip to desc
        return prev.map((s, i) => i === idx ? { ...s, dir: 'desc' as SortDir } : s)
      }
      // Remove this sort
      return prev.filter((_, i) => i !== idx)
    })
  }

  const handleAddContact = (status: ContactStatus) => {
    setDefaultStatus(status)
    setEditingContact(null)
    setDialogOpen(true)
  }

  const handleEditContact = () => {
    if (selectedContact) {
      setEditingContact(selectedContact)
      setDialogOpen(true)
    }
  }

  const handleDeleteContact = async () => {
    if (selectedContact && confirm(`Weet je zeker dat je "${selectedContact.name}" wilt verwijderen?`)) {
      await deleteContact.mutateAsync(selectedContact.id)
      setSelectedContact(null)
    }
  }

  const handleContactClick = (contact: Contact) => {
    setSelectedContact(contact)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          {/* View switcher — ClickUp style tabs */}
          <div className="flex items-center gap-1 border-b border-border">
            {VIEW_TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setView(key)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium transition-all border-b-2 -mb-px',
                  view === key
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
        <button
          onClick={() => { setEditingContact(null); setDefaultStatus('contacted'); setDialogOpen(true) }}
          className="flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-1.5 text-[13px] font-semibold text-midnight hover:bg-primary-hover transition-colors"
        >
          <Plus size={14} />
          Task
        </button>
      </div>

      {/* Filters (only for list view) */}
      {view === 'list' && (
        <ContactFilters filter={filter} onFilterChange={setFilter} />
      )}

      {/* View content */}
      {view === 'list' && (
        <ListView
          contacts={contacts}
          onContactClick={handleContactClick}
          onAddContact={handleAddContact}
          filter={filter}
          sorts={sorts}
          onToggleSort={handleToggleSort}
        />
      )}
      {view === 'board' && (
        <BoardView
          contacts={contacts}
          onContactClick={handleContactClick}
          onAddContact={handleAddContact}
        />
      )}
      {view === 'calendar' && (
        <CalendarView
          contacts={contacts}
          onContactClick={handleContactClick}
        />
      )}

      {/* Contact Dialog */}
      <ContactDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditingContact(null) }}
        contact={editingContact}
        defaultStatus={defaultStatus}
      />

      {/* Contact Detail Panel */}
      {selectedContact && (
        <ContactDetailPanel
          contact={selectedContact}
          onClose={() => setSelectedContact(null)}
          onEdit={handleEditContact}
          onDelete={handleDeleteContact}
        />
      )}
    </div>
  )
}
