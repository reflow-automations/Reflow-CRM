import type { GoogleTaskList, GoogleTask } from '@/types/google-tasks'

const BASE = 'https://www.googleapis.com/tasks/v1'

export class GoogleAuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'GoogleAuthError'
  }
}

async function request<T>(token: string, url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (res.status === 401) {
    throw new GoogleAuthError('Google sessie verlopen')
  }

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Google Tasks API error ${res.status}: ${body}`)
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

export async function fetchTaskLists(token: string): Promise<GoogleTaskList[]> {
  const data = await request<{ items?: GoogleTaskList[] }>(token, `${BASE}/users/@me/lists`)
  return data.items ?? []
}

export async function fetchTasks(
  token: string,
  taskListId: string,
  opts?: { showCompleted?: boolean; showHidden?: boolean }
): Promise<GoogleTask[]> {
  const params = new URLSearchParams({ maxResults: '100' })
  if (opts?.showCompleted !== undefined) params.set('showCompleted', String(opts.showCompleted))
  if (opts?.showHidden !== undefined) params.set('showHidden', String(opts.showHidden))

  const data = await request<{ items?: GoogleTask[] }>(
    token,
    `${BASE}/lists/${taskListId}/tasks?${params}`
  )
  return data.items ?? []
}

export async function createTask(
  token: string,
  taskListId: string,
  body: { title: string; notes?: string; due?: string }
): Promise<GoogleTask> {
  const payload: Record<string, string> = { title: body.title }
  if (body.notes) payload.notes = body.notes
  if (body.due) payload.due = new Date(body.due + 'T00:00:00Z').toISOString()

  return request<GoogleTask>(token, `${BASE}/lists/${taskListId}/tasks`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateTask(
  token: string,
  taskListId: string,
  taskId: string,
  body: Partial<{ title: string; notes: string; due: string | null; status: string; completed: string | null }>
): Promise<GoogleTask> {
  const payload: Record<string, unknown> = {}
  if (body.title !== undefined) payload.title = body.title
  if (body.notes !== undefined) payload.notes = body.notes
  if (body.due !== undefined) payload.due = body.due ? new Date(body.due + 'T00:00:00Z').toISOString() : null
  if (body.status !== undefined) payload.status = body.status
  if (body.completed !== undefined) payload.completed = body.completed

  return request<GoogleTask>(token, `${BASE}/lists/${taskListId}/tasks/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function deleteTask(
  token: string,
  taskListId: string,
  taskId: string
): Promise<void> {
  await request<void>(token, `${BASE}/lists/${taskListId}/tasks/${taskId}`, {
    method: 'DELETE',
  })
}
