export type ContactStatus = 'won' | 'samenwerkings_partners' | 'negotiation' | 'contacted' | 'lost'
export type ContactPriority = 'high' | 'normal' | 'low'
export type ContactSource = 'warm_netwerk' | 'netwerk_event' | 'bni' | 'overig_koud' | 'zelf_contact'
export type ICEStatus = 'todo' | 'doing' | 'done'
export type ICEBucket =
  | 'thinking' | 'creating' | 'communicating' | 'analyzing'
  | 'automating' | 'other' | 'strategy'
  | 'sales_outreach' | 'netwerken' | 'client_work'
  | 'productivity' | 'learning' | 'roi_potentie'

export const STATUS_CONFIG: Record<ContactStatus, { label: string; color: string; bgColor: string; dotColor: string; order: number }> = {
  won:                    { label: 'Won',                    color: 'text-green-400',   bgColor: 'bg-green-500/15 border-green-500/30',   dotColor: 'bg-green-500',    order: 0 },
  samenwerkings_partners: { label: 'Samenwerkings Partners', color: 'text-yellow-400',  bgColor: 'bg-yellow-500/15 border-yellow-500/30', dotColor: 'bg-yellow-500',   order: 1 },
  negotiation:            { label: 'Negotiation',            color: 'text-orange-400',  bgColor: 'bg-orange-500/15 border-orange-500/30', dotColor: 'bg-orange-500',   order: 2 },
  contacted:              { label: 'Contacted',              color: 'text-purple-400',  bgColor: 'bg-purple-500/15 border-purple-500/30', dotColor: 'bg-purple-500',   order: 3 },
  lost:                   { label: 'Lost',                   color: 'text-red-400',     bgColor: 'bg-red-500/15 border-red-500/30',       dotColor: 'bg-red-500',      order: 4 },
}

export const STATUS_ORDER: ContactStatus[] = ['won', 'samenwerkings_partners', 'negotiation', 'contacted', 'lost']

export const PRIORITY_CONFIG: Record<ContactPriority, { label: string; color: string; iconColor: string }> = {
  high:   { label: 'High',   color: 'text-red-400',   iconColor: '#EF4444' },
  normal: { label: 'Normal', color: 'text-blue-400',  iconColor: '#3B82F6' },
  low:    { label: 'Low',    color: 'text-gray-400',  iconColor: '#6B7280' },
}

export const SOURCE_CONFIG: Record<ContactSource, { label: string; color: string; bgColor: string }> = {
  warm_netwerk:  { label: 'Warm netwerk',        color: 'text-green-400',  bgColor: 'bg-green-500/15 text-green-400' },
  netwerk_event: { label: 'Netwerk event',       color: 'text-teal-400',   bgColor: 'bg-teal-500/15 text-teal-400' },
  bni:           { label: 'BNI',                 color: 'text-pink-400',   bgColor: 'bg-pink-500/15 text-pink-400' },
  overig_koud:   { label: 'Overig / koud',       color: 'text-orange-400', bgColor: 'bg-orange-500/15 text-orange-400' },
  zelf_contact:  { label: 'Zelf contact gemaakt', color: 'text-lime-400',   bgColor: 'bg-lime-500/15 text-lime-400' },
}

export const ICE_STATUS_CONFIG: Record<ICEStatus, { label: string; color: string; bgColor: string }> = {
  todo:  { label: 'To do',  color: 'text-gray-400',   bgColor: 'bg-gray-500/15 text-gray-400' },
  doing: { label: 'Doing',  color: 'text-blue-400',   bgColor: 'bg-blue-500/15 text-blue-400' },
  done:  { label: 'Done',   color: 'text-green-400',  bgColor: 'bg-green-500/15 text-green-400' },
}

export const ICE_BUCKET_CONFIG: Record<ICEBucket, { label: string; color: string; bgColor: string }> = {
  thinking:       { label: 'Thinking',       color: 'text-indigo-400',  bgColor: 'bg-indigo-500/15 text-indigo-400' },
  creating:       { label: 'Creating',       color: 'text-pink-400',    bgColor: 'bg-pink-500/15 text-pink-400' },
  communicating:  { label: 'Communicating',  color: 'text-cyan-400',    bgColor: 'bg-cyan-500/15 text-cyan-400' },
  analyzing:      { label: 'Analyzing',      color: 'text-amber-400',   bgColor: 'bg-amber-500/15 text-amber-400' },
  automating:     { label: 'Automating',     color: 'text-emerald-400', bgColor: 'bg-emerald-500/15 text-emerald-400' },
  other:          { label: 'Other',          color: 'text-gray-400',    bgColor: 'bg-gray-500/15 text-gray-400' },
  strategy:       { label: 'Strategy',       color: 'text-violet-400',  bgColor: 'bg-violet-500/15 text-violet-400' },
  sales_outreach: { label: 'Sales/outreach', color: 'text-orange-400',  bgColor: 'bg-orange-500/15 text-orange-400' },
  netwerken:      { label: 'Netwerken',      color: 'text-teal-400',    bgColor: 'bg-teal-500/15 text-teal-400' },
  client_work:    { label: 'Client work',    color: 'text-blue-400',    bgColor: 'bg-blue-500/15 text-blue-400' },
  productivity:   { label: 'Productivity',   color: 'text-lime-400',    bgColor: 'bg-lime-500/15 text-lime-400' },
  learning:       { label: 'Learning',       color: 'text-rose-400',    bgColor: 'bg-rose-500/15 text-rose-400' },
  roi_potentie:   { label: 'ROI potentie!',  color: 'text-yellow-400',  bgColor: 'bg-yellow-500/15 text-yellow-400' },
}
