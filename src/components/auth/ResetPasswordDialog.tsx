import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { KeyRound, Loader2 } from 'lucide-react'

interface ResetPasswordDialogProps {
  onDone: () => void
}

export function ResetPasswordDialog({ onDone }: ResetPasswordDialogProps) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) {
      setError('Wachtwoorden komen niet overeen')
      return
    }
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      onDone()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-2xl border border-border bg-surface p-8 shadow-2xl shadow-black/20">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/25">
              <KeyRound size={24} className="text-midnight" />
            </div>
            <h2 className="font-display text-xl font-bold text-text-main">
              Nieuw wachtwoord instellen
            </h2>
            <p className="mt-2 text-sm text-text-muted">
              Kies een nieuw wachtwoord voor je account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-muted">
                Nieuw wachtwoord
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface-light px-4 py-2.5 text-sm text-text-main placeholder:text-text-dim focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="••••••••"
                required
                minLength={6}
                autoFocus
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-muted">
                Bevestig wachtwoord
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface-light px-4 py-2.5 text-sm text-text-main placeholder:text-text-dim focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="rounded-lg bg-danger-muted px-4 py-2.5 text-sm text-danger">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password || !confirm}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-midnight transition-colors hover:bg-primary-hover disabled:opacity-50"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <KeyRound size={18} />}
              Wachtwoord opslaan
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
