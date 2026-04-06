import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'

export function AppLayout() {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="min-w-0 overflow-x-auto" style={{ marginLeft: '240px', padding: '28px 36px' }}>
        <Outlet />
      </main>
    </div>
  )
}
