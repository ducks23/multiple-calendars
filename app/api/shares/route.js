import { events, shares, nextEventId, nextShareId } from '../_store.js'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const list = Object.values(shares)
  return Response.json(status ? list.filter(s => s.status === status) : list)
}

export async function POST(request) {
  const body = await request.json()
  const id = nextShareId()
  shares[id] = {
    id,
    sourceEventId:    body.sourceEventId,
    sourceCalendarId: body.sourceCalendarId,
    targetCalendarId: body.targetCalendarId,
    eventSnapshot:    body.eventSnapshot,
    requestedAt:      new Date().toISOString(),
    status:           'pending',
  }
  return Response.json(shares[id], { status: 201 })
}

export async function PATCH(request) {
  const body = await request.json()
  const { id, action, resourceId } = body

  if (!shares[id]) return Response.json({ error: 'Not found' }, { status: 404 })
  if (shares[id].status !== 'pending') {
    return Response.json({ error: 'Already processed' }, { status: 400 })
  }

  if (action === 'approve') {
    const snap  = shares[id].eventSnapshot
    const newId = nextEventId()
    events[newId] = {
      id:          newId,
      calendarId:  shares[id].targetCalendarId,
      resourceId:  resourceId || null,
      title:       snap.title,
      start:       snap.start,
      end:         snap.end,
      color:       snap.color,
    }
    shares[id].status     = 'approved'
    shares[id].approvedAt = new Date().toISOString()
    shares[id].newEventId = newId
  } else if (action === 'deny') {
    shares[id].status   = 'denied'
    shares[id].deniedAt = new Date().toISOString()
  }

  return Response.json(shares[id])
}
