import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { TimeEntry } from '@/types/contacts'

export function useTimeEntries(contactId: string | null) {
  return useQuery({
    queryKey: ['time_entries', contactId],
    queryFn: async (): Promise<TimeEntry[]> => {
      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('contact_id', contactId!)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data ?? []
    },
    enabled: !!contactId,
  })
}

export function useAllTimeEntries(filters?: { from?: string; to?: string }) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['all_time_entries', user?.id, filters?.from, filters?.to],
    queryFn: async (): Promise<(TimeEntry & { contact_name?: string; contact_company?: string })[]> => {
      let query = supabase
        .from('time_entries')
        .select('*, contacts!inner(name, company)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })

      if (filters?.from) query = query.gte('created_at', filters.from)
      if (filters?.to) query = query.lte('created_at', filters.to + 'T23:59:59.999Z')

      const { data, error } = await query
      if (error) throw error

      return (data ?? []).map((entry: any) => ({
        ...entry,
        contact_name: entry.contacts?.name,
        contact_company: entry.contacts?.company,
        contacts: undefined,
      }))
    },
    enabled: !!user,
  })
}

export function useTimeTotals() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['time_totals', user?.id],
    queryFn: async (): Promise<Record<string, number>> => {
      const { data, error } = await supabase
        .from('time_entries')
        .select('contact_id, duration_minutes')
        .eq('user_id', user!.id)

      if (error) throw error

      const totals: Record<string, number> = {}
      for (const row of data ?? []) {
        totals[row.contact_id] = (totals[row.contact_id] || 0) + row.duration_minutes
      }
      return totals
    },
    enabled: !!user,
  })
}

export function useSubtaskTimeTotals(contactId: string | null) {
  return useQuery({
    queryKey: ['subtask_time_totals', contactId],
    queryFn: async (): Promise<Record<string, number>> => {
      const { data, error } = await supabase
        .from('time_entries')
        .select('subtask_id, duration_minutes')
        .eq('contact_id', contactId!)
        .not('subtask_id', 'is', null)

      if (error) throw error

      const totals: Record<string, number> = {}
      for (const row of data ?? []) {
        if (row.subtask_id) {
          totals[row.subtask_id] = (totals[row.subtask_id] || 0) + row.duration_minutes
        }
      }
      return totals
    },
    enabled: !!contactId,
  })
}

export function useCreateTimeEntry() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (data: {
      contact_id: string
      subtask_id?: string | null
      duration_minutes: number
      description?: string | null
      started_at?: string | null
      ended_at?: string | null
    }) => {
      const { data: entry, error } = await supabase
        .from('time_entries')
        .insert({
          ...data,
          user_id: user!.id,
          subtask_id: data.subtask_id || null,
          description: data.description || null,
          started_at: data.started_at || null,
          ended_at: data.ended_at || null,
        })
        .select()
        .single()

      if (error) throw error
      return entry
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['time_entries', vars.contact_id] })
      queryClient.invalidateQueries({ queryKey: ['time_totals'] })
      queryClient.invalidateQueries({ queryKey: ['subtask_time_totals', vars.contact_id] })
      queryClient.invalidateQueries({ queryKey: ['all_time_entries'] })
    },
  })
}

export function useDeleteTimeEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('time_entries').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time_entries'] })
      queryClient.invalidateQueries({ queryKey: ['time_totals'] })
      queryClient.invalidateQueries({ queryKey: ['subtask_time_totals'] })
      queryClient.invalidateQueries({ queryKey: ['all_time_entries'] })
    },
  })
}
