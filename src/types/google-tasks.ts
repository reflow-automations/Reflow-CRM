export interface GoogleTaskList {
  id: string
  title: string
  updated: string
}

export interface GoogleTask {
  id: string
  title: string
  notes?: string
  status: 'needsAction' | 'completed'
  due?: string
  completed?: string
  updated: string
  parent?: string
  position: string
  links?: Array<{ type: string; description: string; link: string }>
}

export interface GoogleTaskFormData {
  title: string
  notes: string
  due: string
  contactId: string
}

export interface TaskContactLink {
  id: string
  user_id: string
  google_task_id: string
  google_task_list_id: string
  contact_id: string
  created_at: string
}

export const EMPTY_TASK_FORM: GoogleTaskFormData = {
  title: '',
  notes: '',
  due: '',
  contactId: '',
}
