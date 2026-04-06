import { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="flex min-h-screen items-center justify-center bg-midnight">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-danger-muted">
            <AlertTriangle size={28} className="text-danger" />
          </div>
          <h1 className="font-display text-xl font-bold text-text-main mb-2">
            Er ging iets mis
          </h1>
          <p className="text-sm text-text-muted mb-6">
            {this.state.error?.message || 'Een onverwachte fout is opgetreden.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-midnight transition-colors hover:bg-primary-hover"
          >
            <RefreshCw size={16} />
            Pagina herladen
          </button>
        </div>
      </div>
    )
  }
}
