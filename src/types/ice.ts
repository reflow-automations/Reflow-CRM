import type { ICEStatus, ICEBucket } from '@/lib/constants'

export interface ICEItem {
  id: string
  user_id: string
  title: string
  description: string | null
  buckets: ICEBucket[]
  impact: number
  importance: number
  time_estimate: number
  difficulty: number
  priority_score: number
  status: ICEStatus
  position: number
  created_at: string
  updated_at: string
}

export interface ICEFormData {
  title: string
  description: string
  buckets: ICEBucket[]
  impact: number
  importance: number
  time_estimate: number
  difficulty: number
  status: ICEStatus
}

export const EMPTY_ICE_FORM: ICEFormData = {
  title: '',
  description: '',
  buckets: [],
  impact: 5,
  importance: 5,
  time_estimate: 5,
  difficulty: 5,
  status: 'todo',
}
