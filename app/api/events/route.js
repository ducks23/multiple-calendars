import { events, nextEventId } from '../_store.js'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const calendarId = searchParams.get('calendarId')
  const result = calendarId
    ? Object.fromEntries(Object.entries(events).filter(([, ev]) => ev.calendarId === calendarId))
    : events
  return Response.json(result)
}

export async function POST(request) {
  const body = await request.json()
  const id = nextEventId()
  events[id] = { ...body, id }
  return Response.json(events[id], { status: 201 })
}

export async function PATCH(request) {
  const body = await request.json()
  const { id, ...updates } = body
  if (!events[id]) return Response.json({ error: 'Not found' }, { status: 404 })
  events[id] = { ...events[id], ...updates }
  return Response.json(events[id])
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!events[id]) return Response.json({ error: 'Not found' }, { status: 404 })
  delete events[id]
  return new Response(null, { status: 204 })
}
