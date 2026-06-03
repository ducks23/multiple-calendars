'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

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

  useEffect(() => {
    fetch('/api/shares?status=pending')
      .then(r => r.json())
      .then(s => setPendingCount(s.length))
  }, [pathname])

  const navLinkCls = (active) => cn(
    'flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs mb-0.5 transition-colors',
    active
      ? 'bg-white shadow-sm text-zinc-900 font-semibold'
      : 'text-zinc-500 hover:bg-white hover:text-zinc-800 font-medium',
  )

  return (
    <aside
      className="flex-shrink-0 flex flex-col border-r border-border bg-sidebar"
      style={{ width: 220, fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)' }}
    >
      <div className="px-4 py-4 border-b border-border">
        <span className="text-sm font-bold text-foreground tracking-tight">Calendar</span>
      </div>

      <nav className="flex-1 overflow-y-auto p-2 pt-3 space-y-3">
        {/* Manage */}
        <div>
          <p className="px-2 mb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Manage
          </p>
          <Link href="/approvals" className={navLinkCls(pathname === '/approvals')}>
            <span className="flex-1 truncate">Approvals</span>
            {pendingCount > 0 && (
              <Badge className="h-4 min-w-4 px-1 text-[9px] font-bold rounded-full bg-primary text-primary-foreground">
                {pendingCount}
              </Badge>
            )}
          </Link>
        </div>

        {/* Calendars */}
        <div>
          <p className="px-2 mb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            My Calendars
          </p>
          {calendars.map(cal => {
            const isActive = pathname === `/calendars/${cal.id}`
            return (
              <Link
                key={cal.id}
                href={`/calendars/${cal.id}`}
                className={navLinkCls(isActive)}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: cal.color }}
                />
                <span className="truncate">{cal.name}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </aside>
  )
}
