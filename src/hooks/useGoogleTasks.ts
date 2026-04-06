import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGoogleAuth } from '@/contexts/GoogleAuthContext'
import { GoogleAuthError, fetchTaskLists, fetchTasks, createTask, updateTask, deleteTask } from '@/lib/google-tasks-api'
import { clearGoogleToken } from '@/lib/google-auth'
import type { GoogleTask } from '@/types/google-tasks'
import { toast } from 'sonner'

function useAuthErrorHandler() {
  const { signOutGoogle } = useGoogleAuth()

  return (error: unknown) => {
    if (error instanceof GoogleAuthError) {
      clearGoogleToken()
      signOutGoogle()
      toast.error('Google sessie verlopen, log opnieuw in')
    }
  }
}

export function useTaskLists() {
  const { accessToken } = useGoogleAuth()

  return useQuery({
    queryKey: ['google-task-lists'],
    queryFn: () => fetchTaskLists(accessToken!),
    enabled: !!accessToken,
  })
}

export function useGoogleTasks(taskListId: string | null) {
  const { accessToken } = useGoogleAuth()

  return useQuery({
    queryKey: ['google-tasks', taskListId],
    queryFn: () => fetchTasks(accessToken!, taskListId!, { showCompleted: true, showHidden: true }),
    enabled: !!accessToken && !!taskListId,
  })
}

export function useCreateGoogleTask() {
  const queryClient = useQueryClient()
  const { accessToken } = useGoogleAuth()
  const handleAuthError = useAuthErrorHandler()

  return useMutation({
    mutationFn: async ({ taskListId, title, notes, due }: {
      taskListId: string
      title: string
      notes?: string
      due?: string
    }) => {
      return createTask(accessToken!, taskListId, { title, notes, due })
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['google-tasks', vars.taskListId] })
    },
    onError: handleAuthError,
  })
}

export function useUpdateGoogleTask() {
  const queryClient = useQueryClient()
  const { accessToken } = useGoogleAuth()
  const handleAuthError = useAuthErrorHandler()

  return useMutation({
    mutationFn: async ({ taskListId, taskId, ...body }: {
      taskListId: string
      taskId: string
      title?: string
      notes?: string
      due?: string | null
    }) => {
      return updateTask(accessToken!, taskListId, taskId, body)
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['google-tasks', vars.taskListId] })
    },
    onError: handleAuthError,
  })
}

export function useCompleteGoogleTask() {
  const queryClient = useQueryClient()
  const { accessToken } = useGoogleAuth()
  const handleAuthError = useAuthErrorHandler()

  return useMutation({
    mutationFn: async ({ taskListId, taskId, completed }: {
      taskListId: string
      taskId: string
      completed: boolean
    }) => {
      return updateTask(accessToken!, taskListId, taskId, {
        status: completed ? 'completed' : 'needsAction',
        completed: completed ? new Date().toISOString() : null,
      })
    },
    onMutate: async ({ taskListId, taskId, completed }) => {
      await queryClient.cancelQueries({ queryKey: ['google-tasks', taskListId] })
      queryClient.setQueryData<GoogleTask[]>(['google-tasks', taskListId], (old) =>
        old?.map((t) =>
          t.id === taskId
            ? { ...t, status: completed ? 'completed' as const : 'needsAction' as const }
            : t
        )
      )
    },
    onSettled: (_data, _err, vars) => {
      queryClient.invalidateQueries({ queryKey: ['google-tasks', vars.taskListId] })
    },
    onError: handleAuthError,
  })
}

export function useDeleteGoogleTask() {
  const queryClient = useQueryClient()
  const { accessToken } = useGoogleAuth()
  const handleAuthError = useAuthErrorHandler()

  return useMutation({
    mutationFn: async ({ taskListId, taskId }: { taskListId: string; taskId: string }) => {
      await deleteTask(accessToken!, taskListId, taskId)
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['google-tasks', vars.taskListId] })
      queryClient.invalidateQueries({ queryKey: ['task-contact-links'] })
    },
    onError: handleAuthError,
  })
}
