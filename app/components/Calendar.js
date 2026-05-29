'use client'

import { useState, useEffect } from 'react'
import FullCalendar from '@fullcalendar/react'
import resourceTimelinePlugin from '@fullcalendar/resource-timeline'
import interactionPlugin from '@fullcalendar/interaction'
import EventForm from './EventForm'

/** Zero-pads a number to two digits — used when building datetime-local strings. */
function pad(n) { return String(n).padStart(2, '0') }

/** Converts a Date object to the `YYYY-MM-DDTHH:MM` format expected by datetime-local inputs. */
function toLocal(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/**
 * Interactive resource-timeline calendar for a single calendar.
 * Fetches resources, events, and the full calendar list on mount (and whenever calendarId changes),
 * then renders a FullCalendar resource-timeline view with day/week toggle.
 * Clicking or drag-selecting the timeline opens EventForm for create/edit.
 */
export default function CalendarView({ calendarId }) {
  const [events,    setEvents]    = useState({})
  const [resources, setResources] = useState([])
  const [calendars, setCalendars] = useState([])
  const [formState, setFormState] = useState(null)

  useEffect(() => {
    setEvents({})
    setResources([])
    Promise.all([
      fetch(`/api/resources?calendarId=${calendarId}`).then(r => r.json()),
      fetch(`/api/events?calendarId=${calendarId}`).then(r => r.json()),
      fetch('/api/calendars').then(r => r.json()),
    ]).then(([res, evs, cals]) => {
      setResources(res)
      setEvents(evs)
      setCalendars(cals)
    })
  }, [calendarId])

  const fcResources = resources.map(r => ({ id: r.id, title: r.name, eventColor: r.color }))
  const fcEvents    = Object.values(events).map(ev => ({
    id: ev.id, resourceId: ev.resourceId, title: ev.title,
    start: ev.start, end: ev.end, color: ev.color,
  }))

  /** Opens EventForm pre-filled with the current time and the first available resource. */
  function openNewEventForm() {
    const now = new Date()
    const end = new Date(now); end.setHours(now.getHours() + 1)
    setFormState({
      event: null,
      defaultStart:      toLocal(now),
      defaultEnd:        toLocal(end),
      defaultResourceId: resources[0]?.id,
      defaultColor:      resources[0]?.color,
    })
  }

  /** Called when the user drag-selects a time range on the timeline; opens EventForm with the selected slot pre-filled. */
  function handleSelect(info) {
    const resource = resources.find(r => r.id === info.resource?.id)
    setFormState({
      event: null,
      defaultStart:      toLocal(info.start),
      defaultEnd:        toLocal(info.end),
      defaultResourceId: info.resource?.id,
      defaultColor:      resource?.color,
    })
  }

  /** Called when the user clicks an existing event; opens EventForm in edit mode with that event's data. */
  function handleEventClick(info) {
    const ev = events[info.event.id]
    if (!ev) return
    setFormState({ event: ev, defaultStart: ev.start, defaultEnd: ev.end, defaultResourceId: ev.resourceId })
  }

  /** Persists a create or update via the events API and merges the result into local state. */
  async function handleSave({ id, title, start, end, color, resourceId }) {
    if (id) {
      const res = await fetch('/api/events', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, title, start, end, color, resourceId, calendarId }),
      })
      const updated = await res.json()
      setEvents(prev => ({ ...prev, [updated.id]: updated }))
    } else {
      const res = await fetch('/api/events', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, start, end, color, resourceId, calendarId }),
      })
      const created = await res.json()
      setEvents(prev => ({ ...prev, [created.id]: created }))
    }
    setFormState(null)
  }

  /** Deletes an event via the API and removes it from local state. */
  async function handleDelete(id) {
    await fetch(`/api/events?id=${id}`, { method: 'DELETE' })
    setEvents(prev => { const n = { ...prev }; delete n[id]; return n })
    setFormState(null)
  }

  return (
    <div className="h-screen flex flex-col bg-white p-4"
      style={{ fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)' }}>
      <div className="flex-1 min-h-0">
        <FullCalendar
          key={calendarId}
          plugins={[resourceTimelinePlugin, interactionPlugin]}
          initialView="resourceTimelineDay"
          schedulerLicenseKey="CC-Attribution-NonCommercial-NoDerivatives"
          resources={fcResources}
          events={fcEvents}
          customButtons={{ newEvent: { text: '+ New Event', click: openNewEventForm } }}
          headerToolbar={{
            left: 'prev,next today', center: 'title',
            right: 'newEvent resourceTimelineDay,resourceTimelineWeek',
          }}
          views={{
            resourceTimelineDay:  { buttonText: 'Day' },
            resourceTimelineWeek: { buttonText: 'Week' },
          }}
          selectable={true}
          selectMirror={true}
          select={handleSelect}
          eventClick={handleEventClick}
          height="100%"
          scrollTime="08:00:00"
          nowIndicator={true}
          slotDuration="00:30:00"
          slotLabelInterval="01:00:00"
          resourceAreaHeaderContent="Organization"
          resourceAreaWidth="180px"
          eventTimeFormat={{ hour: 'numeric', minute: '2-digit', omitZeroMinute: true, meridiem: 'short' }}
        />
      </div>

      {formState && (
        <EventForm
          event={formState.event}
          defaultStart={formState.defaultStart}
          defaultEnd={formState.defaultEnd}
          defaultResourceId={formState.defaultResourceId}
          defaultColor={formState.defaultColor}
          resources={resources}
          calendars={calendars}
          currentCalendarId={calendarId}
          onSave={handleSave}
          onClose={() => setFormState(null)}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}
