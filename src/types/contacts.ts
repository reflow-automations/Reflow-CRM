import type { ContactStatus, ContactPriority, ContactSource } from '@/lib/constants'

export interface Contact {
  id: string
  user_id: string
  name: string
  company: string | null
  email: string | null
  phone: string | null
  next_follow_up: string | null
  priority: ContactPriority
  source: ContactSource
  status: ContactStatus
  position: number
  notes: string | null
  linkedin_url: string | null
  website: string | null
  created_at: string
  updated_at: string
}

export interface ContactNote {
  id: string
  contact_id: string
  user_id: string
  content: string
  created_at: string
}

export interface ContactWithNotes extends Contact {
  contact_notes: ContactNote[]
}

export interface ContactFormData {
  name: string
  company: string
  email: string
  phone: string
  next_follow_up: string
  priority: ContactPriority
  source: ContactSource
  status: ContactStatus
  linkedin_url: string
  website: string
}

export interface Subtask {
  id: string
  contact_id: string
  user_id: string
  name: string
  completed: boolean
  position: number
  created_at: string
  updated_at: string
}

export interface TimeEntry {
  id: string
  user_id: string
  contact_id: string
  subtask_id: string | null
  duration_minutes: number
  description: string | null
  started_at: string | null
  ended_at: string | null
  created_at: string
}

export const EMPTY_CONTACT_FORM: ContactFormData = {
  name: '',
  company: '',
  email: '',
  phone: '',
  next_follow_up: '',
  priority: 'normal',
  source: 'overig_koud',
  status: 'contacted',
  linkedin_url: '',
  website: '',
}
