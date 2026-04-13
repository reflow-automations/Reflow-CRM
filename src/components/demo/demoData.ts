import type { Contact } from '@/types/contacts'
import type { ICEItem } from '@/types/ice'

const today = new Date()
const d = (offset: number) => {
  const date = new Date(today)
  date.setDate(date.getDate() + offset)
  return date.toISOString()
}

export const DEMO_CONTACTS: Contact[] = [
  { id: '1', user_id: 'demo', name: 'Lars van der Berg', company: 'TechFlow B.V.', email: 'lars@techflow.nl', phone: '+31612345678', next_follow_up: d(2), priority: 'high', source: 'warm_netwerk', status: 'negotiation', position: 0, notes: null, linkedin_url: null, website: null, deal_value: 4800, created_at: d(-30), updated_at: d(-2) },
  { id: '2', user_id: 'demo', name: 'Sophie Jansen', company: 'GreenScale', email: 'sophie@greenscale.nl', phone: null, next_follow_up: d(-3), priority: 'high', source: 'netwerk_event', status: 'negotiation', position: 1, notes: null, linkedin_url: null, website: null, deal_value: 7200, created_at: d(-45), updated_at: d(-5) },
  { id: '3', user_id: 'demo', name: 'Thomas de Wit', company: 'Bright Minds Agency', email: 'thomas@brightminds.nl', phone: '+31698765432', next_follow_up: d(5), priority: 'normal', source: 'bni', status: 'contacted', position: 2, notes: null, linkedin_url: null, website: null, deal_value: 3200, created_at: d(-20), updated_at: d(-3) },
  { id: '4', user_id: 'demo', name: 'Eva Bakker', company: 'Cloudnine Solutions', email: 'eva@cloudnine.io', phone: null, next_follow_up: d(-1), priority: 'high', source: 'warm_netwerk', status: 'negotiation', position: 3, notes: null, linkedin_url: null, website: null, deal_value: 12000, created_at: d(-60), updated_at: d(-1) },
  { id: '5', user_id: 'demo', name: 'Mark Hendriks', company: 'Automate.ai', email: 'mark@automate.ai', phone: '+31687654321', next_follow_up: d(1), priority: 'normal', source: 'zelf_contact', status: 'contacted', position: 4, notes: null, linkedin_url: null, website: null, deal_value: 2400, created_at: d(-15), updated_at: d(-4) },
  { id: '6', user_id: 'demo', name: 'Anne de Vries', company: 'FinOps Nederland', email: 'anne@finops.nl', phone: null, next_follow_up: null, priority: 'normal', source: 'warm_netwerk', status: 'won', position: 5, notes: null, linkedin_url: null, website: null, deal_value: 6000, created_at: d(-90), updated_at: d(-10) },
  { id: '7', user_id: 'demo', name: 'Bram Kuiper', company: 'ScaleUp Hub', email: 'bram@scaleuphub.nl', phone: '+31623456789', next_follow_up: null, priority: 'low', source: 'overig_koud', status: 'won', position: 6, notes: null, linkedin_url: null, website: null, deal_value: 9600, created_at: d(-120), updated_at: d(-20) },
  { id: '8', user_id: 'demo', name: 'Fleur Visser', company: 'Digital Crafters', email: 'fleur@digitalcrafters.nl', phone: null, next_follow_up: d(7), priority: 'normal', source: 'netwerk_event', status: 'contacted', position: 7, notes: null, linkedin_url: null, website: null, deal_value: null, created_at: d(-10), updated_at: d(-2) },
  { id: '9', user_id: 'demo', name: 'Peter Mulder', company: 'Revenue Labs', email: 'peter@revenuelabs.nl', phone: '+31634567890', next_follow_up: d(3), priority: 'high', source: 'bni', status: 'samenwerkings_partners', position: 8, notes: null, linkedin_url: null, website: null, deal_value: null, created_at: d(-50), updated_at: d(-7) },
  { id: '10', user_id: 'demo', name: 'Lisa van Dijk', company: 'Growth Engine', email: 'lisa@growthengine.nl', phone: null, next_follow_up: d(-5), priority: 'normal', source: 'warm_netwerk', status: 'contacted', position: 9, notes: null, linkedin_url: null, website: null, deal_value: 1800, created_at: d(-25), updated_at: d(-6) },
  { id: '11', user_id: 'demo', name: 'Wouter Smit', company: 'DataPulse', email: 'wouter@datapulse.nl', phone: '+31645678901', next_follow_up: null, priority: 'low', source: 'overig_koud', status: 'lost', position: 10, notes: null, linkedin_url: null, website: null, deal_value: 3600, created_at: d(-80), updated_at: d(-40) },
  { id: '12', user_id: 'demo', name: 'Julia Meijer', company: 'NoCode Studio', email: 'julia@nocodestudio.nl', phone: null, next_follow_up: d(10), priority: 'normal', source: 'zelf_contact', status: 'contacted', position: 11, notes: null, linkedin_url: null, website: null, deal_value: 5400, created_at: d(-8), updated_at: d(-1) },
]

export const DEMO_ICE_ITEMS: ICEItem[] = [
  { id: 'i1', user_id: 'demo', title: 'AI-gestuurde lead scoring pipeline', description: 'Automatisch leads scoren op basis van engagement', buckets: ['automating', 'roi_potentie'], impact: 9, importance: 8, time_estimate: 4, difficulty: 5, priority_score: 16.1, status: 'doing', position: 0, created_at: d(-14), updated_at: d(-2) },
  { id: 'i2', user_id: 'demo', title: 'Klant-onboarding workflow automatiseren', description: 'n8n flow voor onboarding emails en taken', buckets: ['automating', 'client_work'], impact: 8, importance: 9, time_estimate: 3, difficulty: 4, priority_score: 20.8, status: 'todo', position: 1, created_at: d(-10), updated_at: d(-3) },
  { id: 'i3', user_id: 'demo', title: 'LinkedIn outreach campagne Q2', description: 'Gerichte connectie-strategie voor SaaS founders', buckets: ['sales_outreach', 'netwerken'], impact: 7, importance: 7, time_estimate: 5, difficulty: 3, priority_score: 12.7, status: 'todo', position: 2, created_at: d(-7), updated_at: d(-1) },
  { id: 'i4', user_id: 'demo', title: 'Dashboard analytics uitbreiden', description: 'Conversie-funnel en ROI metrics toevoegen', buckets: ['creating', 'analyzing'], impact: 6, importance: 7, time_estimate: 6, difficulty: 5, priority_score: 7.7, status: 'todo', position: 3, created_at: d(-5), updated_at: d(-1) },
  { id: 'i5', user_id: 'demo', title: 'Webinar funnel opzetten', description: 'Automatische registratie en follow-up flow', buckets: ['strategy', 'sales_outreach'], impact: 8, importance: 6, time_estimate: 7, difficulty: 4, priority_score: 9.1, status: 'todo', position: 4, created_at: d(-3), updated_at: d(-1) },
  { id: 'i6', user_id: 'demo', title: 'CRM integratie met Moneybird', description: 'Facturen automatisch koppelen aan contacten', buckets: ['automating', 'productivity'], impact: 7, importance: 8, time_estimate: 4, difficulty: 6, priority_score: 11.4, status: 'doing', position: 5, created_at: d(-12), updated_at: d(-2) },
]
