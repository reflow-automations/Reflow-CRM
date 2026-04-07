import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { NextEventWidget } from '@/components/shared/NextEventWidget'

export function AppLayout() {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <NextEventWidget />
      <main className="min-w-0 overflow-x-auto" style={{ marginLeft: '240px', padding: '28px 36px' }}>
        <Outlet />
      </main>
    </div>
  )
}
