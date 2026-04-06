import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { Contact, ContactNote, ContactFormData } from '@/types/contacts'
import type { ContactStatus } from '@/lib/constants'

export function useContacts() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['contacts', user?.id],
    queryFn: async (): Promise<Contact[]> => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user!.id)
        .order('position', { ascending: true })
        .order('created_at', { ascending: false })

      if (error) throw error
      return data ?? []
    },
    enabled: !!user,
  })
}

export function useContactNotes(contactId: string | null) {
  return useQuery({
    queryKey: ['contact_notes', contactId],
    queryFn: async (): Promise<ContactNote[]> => {
      const { data, error } = await supabase
        .from('contact_notes')
        .select('*')
        .eq('contact_id', contactId!)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data ?? []
    },
    enabled: !!contactId,
  })
}

export function useCreateContact() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (data: ContactFormData) => {
      const { data: contact, error } = await supabase
        .from('contacts')
        .insert({
          ...data,
          user_id: user!.id,
          next_follow_up: data.next_follow_up || null,
          company: data.company || null,
          email: data.email || null,
          phone: data.phone || null,
          linkedin_url: data.linkedin_url || null,
          website: data.website || null,
        })
        .select()
        .single()

      if (error) throw error
      return contact
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
    },
  })
}

export function useUpdateContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Contact> & { id: string }) => {
      const { data: contact, error } = await supabase
        .from('contacts')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return contact
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
    },
  })
}

export function useDeleteContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
    },
  })
}

export function useUpdateContactStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ContactStatus }) => {
      const { error } = await supabase
        .from('contacts')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['contacts'] })
      const previousContacts = queryClient.getQueryData<Contact[]>(['contacts'])

      queryClient.setQueriesData<Contact[]>({ queryKey: ['contacts'] }, (old) =>
        old?.map((c) => (c.id === id ? { ...c, status } : c))
      )

      return { previousContacts }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousContacts) {
        queryClient.setQueriesData({ queryKey: ['contacts'] }, context.previousContacts)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
    },
  })
}

export function useAddContactNote() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({ contactId, content }: { contactId: string; content: string }) => {
      const { data, error } = await supabase
        .from('contact_notes')
        .insert({
          contact_id: contactId,
          user_id: user!.id,
          content,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contact_notes', variables.contactId] })
    },
  })
}
