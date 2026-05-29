'use client'

import dynamic from 'next/dynamic'

// ssr: false must live in a client component per Next.js 16 rules.
// FullCalendar accesses the DOM at module init, so it cannot run on the server.
const CalendarView = dynamic(() => import('./Calendar'), { ssr: false })

/**
 * Thin wrapper that disables SSR for the FullCalendar-based CalendarView.
 * FullCalendar touches the DOM at module init so it must be loaded client-side only.
 */
export default function CalendarLoader({ calendarId }) {
  return <CalendarView calendarId={calendarId} />
}
