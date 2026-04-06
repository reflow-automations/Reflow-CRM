import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { TaskContactLink } from '@/types/google-tasks'

export function useTaskContactLinks(contactId: string | null) {
  return useQuery({
    queryKey: ['task-contact-links', contactId],
    queryFn: async (): Promise<TaskContactLink[]> => {
      const { data, error } = await supabase
        .from('task_contact_links')
        .select('*')
        .eq('contact_id', contactId!)

      if (error) throw error
      return data ?? []
    },
    enabled: !!contactId,
  })
}

export function useAllTaskContactLinks() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['task-contact-links', 'all', user?.id],
    queryFn: async (): Promise<TaskContactLink[]> => {
      const { data, error } = await supabase
        .from('task_contact_links')
        .select('*')
        .eq('user_id', user!.id)

      if (error) throw error
      return data ?? []
    },
    enabled: !!user,
  })
}

export function useLinkTaskToContact() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({
      googleTaskId,
      googleTaskListId,
      contactId,
    }: {
      googleTaskId: string
      googleTaskListId: string
      contactId: string
    }) => {
      const { data, error } = await supabase
        .from('task_contact_links')
        .insert({
          user_id: user!.id,
          google_task_id: googleTaskId,
          google_task_list_id: googleTaskListId,
          contact_id: contactId,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-contact-links'] })
    },
  })
}

export function useUnlinkTaskFromContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (linkId: string) => {
      const { error } = await supabase
        .from('task_contact_links')
        .delete()
        .eq('id', linkId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-contact-links'] })
    },
  })
}
