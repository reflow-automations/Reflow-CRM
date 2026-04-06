const SCOPE = 'https://www.googleapis.com/auth/tasks'
const STORAGE_KEY = 'goog_tasks_token'

interface StoredToken {
  access_token: string
  expires_at: number
}

let scriptPromise: Promise<void> | null = null

export function loadGoogleScript(): Promise<void> {
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise((resolve, reject) => {
    if (typeof google !== 'undefined' && google.accounts?.oauth2) {
      resolve()
      return
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Google Identity Services script failed to load'))
    document.head.appendChild(script)
  })

  return scriptPromise
}

export function requestGoogleToken(): Promise<string> {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  if (!clientId) throw new Error('Missing VITE_GOOGLE_CLIENT_ID environment variable')

  return new Promise((resolve, reject) => {
    const client = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPE,
      callback: (response) => {
        if (response.error) {
          reject(new Error(response.error_description || response.error))
          return
        }

        const stored: StoredToken = {
          access_token: response.access_token,
          expires_at: Date.now() + response.expires_in * 1000,
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
        resolve(response.access_token)
      },
      error_callback: (error) => {
        reject(new Error(error.message || 'Google OAuth failed'))
      },
    })

    client.requestAccessToken()
  })
}

export function getStoredToken(): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    const stored: StoredToken = JSON.parse(raw)
    if (Date.now() >= stored.expires_at - 60_000) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }

    return stored.access_token
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

export function clearGoogleToken(): void {
  const token = getStoredToken()
  if (token) {
    try { google.accounts.oauth2.revoke(token) } catch { /* ignore */ }
  }
  localStorage.removeItem(STORAGE_KEY)
}

export function isGoogleAuthenticated(): boolean {
  return getStoredToken() !== null
}
