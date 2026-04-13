import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { GoogleAuthProvider } from '@/contexts/GoogleAuthContext'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoginPage } from '@/components/auth/LoginPage'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { DashboardPage } from '@/components/dashboard/DashboardPage'
import { CRMPage } from '@/components/crm/CRMPage'
import { ICEPage } from '@/components/ice/ICEPage'
import { GoogleTasksPage } from '@/components/tasks/GoogleTasksPage'
import { TimeOverviewPage } from '@/components/time-tracking/TimeOverviewPage'
import { DemoPage } from '@/components/demo/DemoPage'
import { ResetPasswordDialog } from '@/components/auth/ResetPasswordDialog'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { Loader2 } from 'lucide-react'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: 1,
    },
  },
})

function AppRoutes() {
  const { loading, needsPasswordReset, clearPasswordReset } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-midnight">
        <div className="text-center">
          <Loader2 size={32} className="mx-auto animate-spin text-primary mb-3" />
          <p className="text-sm text-text-muted">Laden...</p>
        </div>
      </div>
    )
  }

  return (
    <>
    {needsPasswordReset && <ResetPasswordDialog onDone={clearPasswordReset} />}
    <Routes>
      <Route path="login" element={<LoginPage />} />
      <Route path="demo" element={<DemoPage />} />
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="crm" element={<CRMPage />} />
        <Route path="ice" element={<ICEPage />} />
        <Route path="tasks" element={<GoogleTasksPage />} />
        <Route path="time" element={<TimeOverviewPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <GoogleAuthProvider>
          <AppRoutes />
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#0F172A',
                border: '1px solid #334155',
                color: '#F8FAFC',
              },
            }}
          />
        </GoogleAuthProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
    </ErrorBoundary>
  )
}
