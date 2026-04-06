import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { Subtask } from '@/types/contacts'

export function useSubtasks(contactId: string | null) {
  return useQuery({
    queryKey: ['subtasks', contactId],
    queryFn: async (): Promise<Subtask[]> => {
      const { data, error } = await supabase
        .from('subtasks')
        .select('*')
        .eq('contact_id', contactId!)
        .order('position', { ascending: true })
        .order('created_at', { ascending: true })

      if (error) throw error
      return data ?? []
    },
    enabled: !!contactId,
  })
}

export function useSubtaskCounts() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['subtask_counts', user?.id],
    queryFn: async (): Promise<Record<string, { total: number; done: number }>> => {
      const { data, error } = await supabase
        .from('subtasks')
        .select('id, contact_id, completed')
        .eq('user_id', user!.id)

      if (error) throw error

      const counts: Record<string, { total: number; done: number }> = {}
      for (const row of data ?? []) {
        if (!counts[row.contact_id]) counts[row.contact_id] = { total: 0, done: 0 }
        counts[row.contact_id].total++
        if (row.completed) counts[row.contact_id].done++
      }
      return counts
    },
    enabled: !!user,
  })
}

export function useCreateSubtask() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({ contactId, name }: { contactId: string; name: string }) => {
      const { data, error } = await supabase
        .from('subtasks')
        .insert({ contact_id: contactId, user_id: user!.id, name })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['subtasks', vars.contactId] })
      queryClient.invalidateQueries({ queryKey: ['subtask_counts'] })
    },
  })
}

export function useUpdateSubtask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Subtask> & { id: string }) => {
      const { error } = await supabase
        .from('subtasks')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subtasks'] })
      queryClient.invalidateQueries({ queryKey: ['subtask_counts'] })
    },
  })
}

export function useToggleSubtask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { error } = await supabase
        .from('subtasks')
        .update({ completed, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
    },
    onMutate: async ({ id, completed }) => {
      await queryClient.cancelQueries({ queryKey: ['subtasks'] })
      queryClient.setQueriesData<Subtask[]>({ queryKey: ['subtasks'] }, (old) =>
        old?.map((s) => (s.id === id ? { ...s, completed } : s))
      )
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['subtasks'] })
      queryClient.invalidateQueries({ queryKey: ['subtask_counts'] })
    },
  })
}

export function useDeleteSubtask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('subtasks').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subtasks'] })
      queryClient.invalidateQueries({ queryKey: ['subtask_counts'] })
    },
  })
}
