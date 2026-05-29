import Sidebar from '../components/Sidebar'

/** Layout for all calendar views. Renders the shared Sidebar alongside the calendar page content. */
export default function CalendarsLayout({ children }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-hidden min-w-0">
        {children}
      </main>
    </div>
  )
}
