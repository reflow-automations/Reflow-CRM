import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { loadGoogleScript, requestGoogleToken, getStoredToken, clearGoogleToken, trySilentRefresh } from '@/lib/google-auth'
import { toast } from 'sonner'

interface GoogleAuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  accessToken: string | null
  signInWithGoogle: () => Promise<void>
  signOutGoogle: () => void
}

const GoogleAuthContext = createContext<GoogleAuthContextType | undefined>(undefined)

export function GoogleAuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadGoogleScript()
      .then(async () => {
        const token = getStoredToken()
        if (token) {
          setAccessToken(token)
          return
        }
        // No valid token — try silent refresh if user ever consented
        const refreshed = await trySilentRefresh()
        if (refreshed) setAccessToken(refreshed)
      })
      .catch(() => {
        // Script load failure is non-fatal — user can try connecting later
      })
      .finally(() => setIsLoading(false))
  }, [])

  // Periodic silent refresh ~5 min before expiry
  useEffect(() => {
    if (!accessToken) return
    const interval = setInterval(async () => {
      const token = getStoredToken()
      if (!token) {
        const refreshed = await trySilentRefresh()
        if (refreshed) setAccessToken(refreshed)
        else setAccessToken(null)
      }
    }, 60_000)
    return () => clearInterval(interval)
  }, [accessToken])

  const signInWithGoogle = async () => {
    try {
      await loadGoogleScript()
      const token = await requestGoogleToken()
      setAccessToken(token)
      toast.success('Google Tasks verbonden')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Google login mislukt'
      if (!message.includes('popup_closed')) {
        toast.error(message)
      }
    }
  }

  const signOutGoogle = () => {
    clearGoogleToken()
    setAccessToken(null)
    toast.success('Google Tasks ontkoppeld')
  }

  return (
    <GoogleAuthContext.Provider
      value={{
        isAuthenticated: !!accessToken,
        isLoading,
        accessToken,
        signInWithGoogle,
        signOutGoogle,
      }}
    >
      {children}
    </GoogleAuthContext.Provider>
  )
}

export function useGoogleAuth() {
  const context = useContext(GoogleAuthContext)
  if (context === undefined) {
    throw new Error('useGoogleAuth must be used within a GoogleAuthProvider')
  }
  return context
}
