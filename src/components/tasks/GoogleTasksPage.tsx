import { CheckSquare } from 'lucide-react'

export function GoogleTasksPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Google Tasks</h1>
        <p className="text-sm text-text-muted">Bekijk je Google Tasks hier (komt binnenkort)</p>
      </div>

      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <CheckSquare size={32} className="text-primary" />
          </div>
          <h3 className="font-display text-lg font-semibold mb-2">Google Tasks integratie</h3>
          <p className="text-sm text-text-muted max-w-sm">
            Binnenkort kun je hier je Google Tasks bekijken. De integratie wordt in een volgende fase gebouwd.
          </p>
        </div>
      </div>
    </div>
  )
}
