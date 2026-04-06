import Papa from 'papaparse'
import type { Contact } from '@/types/contacts'
import { STATUS_CONFIG, PRIORITY_CONFIG, SOURCE_CONFIG } from '@/lib/constants'

export function exportContactsCSV(contacts: Contact[]) {
  const rows = contacts.map(c => ({
    Naam: c.name,
    Bedrijf: c.company ?? '',
    Email: c.email ?? '',
    Telefoon: c.phone ?? '',
    Status: STATUS_CONFIG[c.status]?.label ?? c.status,
    Prioriteit: PRIORITY_CONFIG[c.priority]?.label ?? c.priority,
    Bron: SOURCE_CONFIG[c.source]?.label ?? c.source,
    Opvolgdatum: c.next_follow_up ?? '',
    Dealwaarde: c.deal_value ?? '',
    LinkedIn: c.linkedin_url ?? '',
    Website: c.website ?? '',
    Aangemaakt: c.created_at ? new Date(c.created_at).toLocaleDateString('nl-NL') : '',
  }))

  const csv = Papa.unparse(rows, { delimiter: ';' })
  downloadCSV(csv, `crm-export-${new Date().toISOString().slice(0, 10)}.csv`)
}

export function exportTimeEntriesCSV(entries: Array<{
  duration_minutes: number
  created_at: string
  contact_name?: string
  contact_company?: string
  description?: string | null
}>) {
  const rows = entries.map(e => ({
    Contact: e.contact_name ?? '',
    Bedrijf: e.contact_company ?? '',
    Duur_minuten: e.duration_minutes,
    Beschrijving: e.description ?? '',
    Datum: new Date(e.created_at).toLocaleDateString('nl-NL'),
  }))

  const csv = Papa.unparse(rows, { delimiter: ';' })
  downloadCSV(csv, `time-export-${new Date().toISOString().slice(0, 10)}.csv`)
}

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
