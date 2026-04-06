import { Search, Filter, X } from 'lucide-react'
import { STATUS_CONFIG, PRIORITY_CONFIG, SOURCE_CONFIG, type ContactStatus } from '@/lib/constants'

interface ContactFiltersProps {
  filter: {
    search: string
    status: ContactStatus | 'all'
    priority: string
    source: string
  }
  onFilterChange: (filter: ContactFiltersProps['filter']) => void
}

export function ContactFilters({ filter, onFilterChange }: ContactFiltersProps) {
  const hasActiveFilters = filter.status !== 'all' || filter.priority !== 'all' || filter.source !== 'all'

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-dim" />
        <input
          type="text"
          value={filter.search}
          onChange={(e) => onFilterChange({ ...filter, search: e.target.value })}
          placeholder="Zoek op naam, bedrijf, email..."
          className="w-full rounded-lg border border-border bg-surface-light pl-10 pr-4 py-2.5 text-[13px] text-text-main placeholder:text-text-dim focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Status filter */}
      <select
        value={filter.status}
        onChange={(e) => onFilterChange({ ...filter, status: e.target.value as ContactStatus | 'all' })}
        className="rounded-lg border border-border bg-surface-light px-3.5 py-2.5 text-[13px] text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      >
        <option value="all">Alle statussen</option>
        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
          <option key={key} value={key}>{config.label}</option>
        ))}
      </select>

      {/* Priority filter */}
      <select
        value={filter.priority}
        onChange={(e) => onFilterChange({ ...filter, priority: e.target.value })}
        className="rounded-lg border border-border bg-surface-light px-3.5 py-2.5 text-[13px] text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      >
        <option value="all">Alle prioriteiten</option>
        {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
          <option key={key} value={key}>{config.label}</option>
        ))}
      </select>

      {/* Source filter */}
      <select
        value={filter.source}
        onChange={(e) => onFilterChange({ ...filter, source: e.target.value })}
        className="rounded-lg border border-border bg-surface-light px-3.5 py-2.5 text-[13px] text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      >
        <option value="all">Alle bronnen</option>
        {Object.entries(SOURCE_CONFIG).map(([key, config]) => (
          <option key={key} value={key}>{config.label}</option>
        ))}
      </select>

      {/* Clear filters */}
      {hasActiveFilters && (
        <button
          onClick={() => onFilterChange({ search: filter.search, status: 'all', priority: 'all', source: 'all' })}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2.5 text-[12px] text-text-dim hover:text-danger transition-colors"
        >
          <X size={14} />
          Reset
        </button>
      )}
    </div>
  )
}
