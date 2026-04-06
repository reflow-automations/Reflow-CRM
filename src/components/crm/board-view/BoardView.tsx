import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  closestCorners,
} from '@dnd-kit/core'
import { STATUS_ORDER, type ContactStatus } from '@/lib/constants'
import type { Contact } from '@/types/contacts'
import { useUpdateContactStatus } from '@/hooks/useContacts'
import { BoardColumn } from './BoardColumn'
import { ContactCard } from './ContactCard'

interface BoardViewProps {
  contacts: Contact[]
  onContactClick: (contact: Contact) => void
  onAddContact: (status: ContactStatus) => void
}

export function BoardView({ contacts, onContactClick, onAddContact }: BoardViewProps) {
  const [activeContact, setActiveContact] = useState<Contact | null>(null)
  const updateStatus = useUpdateContactStatus()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const groupedByStatus = STATUS_ORDER.reduce<Record<ContactStatus, Contact[]>>((acc, status) => {
    acc[status] = contacts.filter((c) => c.status === status)
    return acc
  }, {} as Record<ContactStatus, Contact[]>)

  const handleDragStart = (event: DragStartEvent) => {
    const contact = contacts.find((c) => c.id === event.active.id)
    setActiveContact(contact ?? null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveContact(null)
    const { active, over } = event
    if (!over) return

    const contactId = active.id as string
    const newStatus = over.id as ContactStatus

    const contact = contacts.find((c) => c.id === contactId)
    if (!contact || contact.status === newStatus) return

    updateStatus.mutate({ id: contactId, status: newStatus })
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STATUS_ORDER.map((status) => (
          <BoardColumn
            key={status}
            status={status}
            contacts={groupedByStatus[status]}
            onContactClick={onContactClick}
            onAddContact={onAddContact}
          />
        ))}
      </div>

      <DragOverlay>
        {activeContact && (
          <ContactCard contact={activeContact} onClick={() => {}} isDragOverlay />
        )}
      </DragOverlay>
    </DndContext>
  )
}
