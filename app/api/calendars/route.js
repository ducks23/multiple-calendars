const calendars = [
  { id: 'work',     name: 'Work',            color: '#3b82f6' },
  { id: 'team',     name: 'Team Sync',       color: '#8b5cf6' },
  { id: 'clients',  name: 'Client Meetings', color: '#f59e0b' },
  { id: 'personal', name: 'Personal',        color: '#10b981' },
]

/** Returns the full list of available calendars. */
export async function GET() {
  return Response.json(calendars)
}
