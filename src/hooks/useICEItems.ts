import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { ICEItem, ICEFormData } from '@/types/ice'

export function useICEItems() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['ice_items', user?.id],
    queryFn: async (): Promise<ICEItem[]> => {
      const { data, error } = await supabase
        .from('ice_items')
        .select('*')
        .eq('user_id', user!.id)
        .order('priority_score', { ascending: false })

      if (error) throw error
      return data ?? []
    },
    enabled: !!user,
  })
}

export function useCreateICEItem() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (data: ICEFormData) => {
      const { data: item, error } = await supabase
        .from('ice_items')
        .insert({
          ...data,
          user_id: user!.id,
          description: data.description || null,
        })
        .select()
        .single()

      if (error) throw error
      return item
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ice_items'] })
    },
  })
}

export function useUpdateICEItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<ICEItem> & { id: string }) => {
      const { data: item, error } = await supabase
        .from('ice_items')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return item
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ice_items'] })
    },
  })
}

export function useDeleteICEItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ice_items')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ice_items'] })
    },
  })
}
