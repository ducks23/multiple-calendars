'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

/**
 * Persistent left-hand navigation sidebar.
 * Fetches the calendar list and pending share count on mount, and refreshes
 * the pending badge whenever the active route changes (so it updates after
 * the user approves or denies items on the Approvals page).
 */
export default function Sidebar() {
  const [calendars,    setCalendars]    = useState([])
  const [pendingCount, setPendingCount] = useState(0)
  const pathname = usePathname()

  useEffect(() => {
    fetch('/api/calendars').then(r => r.json()).then(setCalendars)
    fetch('/api/shares?status=pending')
      .then(r => r.json())
      .then(s => setPendingCount(s.length))
  }, [])

  // Refresh badge whenever navigating to/from approvals
  useEffect(() => {
    fetch('/api/shares?status=pending')
      .then(r => r.json())
      .then(s => setPendingCount(s.length))
  }, [pathname])

  /** Renders a styled navigation link, highlighted when active, with an optional numeric badge. */
  const navLink = (href, label, badge) => {
    const isActive = pathname === href
    return (
      <Link
        href={href}
        className={[
          'flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs mb-0.5 transition-colors',
          isActive
            ? 'bg-white shadow-sm text-zinc-900 font-semibold'
            : 'text-zinc-500 hover:bg-white hover:text-zinc-800 font-medium',
        ].join(' ')}
      >
        <span className="flex-1 truncate">{label}</span>
        {badge > 0 && (
          <span className="flex-shrink-0 min-w-4 h-4 px-1 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center">
            {badge}
          </span>
        )}
      </Link>
    )
  }

  return (
    <aside
      className="flex-shrink-0 flex flex-col border-r border-zinc-200 bg-zinc-50"
      style={{ width: 220, fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)' }}
    >
      {/* App name */}
      <div className="px-4 py-4 border-b border-zinc-200">
        <span className="text-sm font-bold text-zinc-900 tracking-tight">Calendar</span>
      </div>

      <nav className="flex-1 overflow-y-auto p-2 pt-3 space-y-3">
        {/* Manage section */}
        <div>
          <p className="px-2 mb-1 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Manage</p>
          {navLink('/approvals', 'Approvals', pendingCount)}
        </div>

        {/* Calendars section */}
        <div>
          <p className="px-2 mb-1 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">My Calendars</p>
          {calendars.map(cal => {
            const isActive = pathname === `/calendars/${cal.id}`
            return (
              <Link
                key={cal.id}
                href={`/calendars/${cal.id}`}
                className={[
                  'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs mb-0.5 transition-colors',
                  isActive
                    ? 'bg-white shadow-sm text-zinc-900 font-semibold'
                    : 'text-zinc-500 hover:bg-white hover:text-zinc-800 font-medium',
                ].join(' ')}
              >
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cal.color }} />
                <span className="truncate">{cal.name}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </aside>
  )
}
