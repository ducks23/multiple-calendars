import { events, nextEventId } from '../_store.js'

/** Returns all events, or only those belonging to a specific calendar when `calendarId` is provided as a query param. */
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const calendarId = searchParams.get('calendarId')
  const result = calendarId
    ? Object.fromEntries(Object.entries(events).filter(([, ev]) => ev.calendarId === calendarId))
    : events
  return Response.json(result)
}

/** Creates a new event from the request body and returns it with a generated id (201). */
export async function POST(request) {
  const body = await request.json()
  const id = nextEventId()
  events[id] = { ...body, id }
  return Response.json(events[id], { status: 201 })
}

/** Partially updates an existing event by id; returns 404 if the event does not exist. */
export async function PATCH(request) {
  const body = await request.json()
  const { id, ...updates } = body
  if (!events[id]) return Response.json({ error: 'Not found' }, { status: 404 })
  events[id] = { ...events[id], ...updates }
  return Response.json(events[id])
}

/** Deletes the event identified by the `id` query param; returns 404 if not found, 204 on success. */
export async function DELETE(request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!events[id]) return Response.json({ error: 'Not found' }, { status: 404 })
  delete events[id]
  return new Response(null, { status: 204 })
}
