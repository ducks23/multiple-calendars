const resourcesByCalendar = {
  work: [
    { id: 'eng',       name: 'Engineering', color: '#3b82f6' },
    { id: 'product',   name: 'Product',     color: '#8b5cf6' },
    { id: 'design',    name: 'Design',      color: '#f59e0b' },
    { id: 'sales',     name: 'Sales',       color: '#ef4444' },
    { id: 'marketing', name: 'Marketing',   color: '#10b981' },
  ],
  team: [
    { id: 'frontend', name: 'Frontend', color: '#3b82f6' },
    { id: 'backend',  name: 'Backend',  color: '#10b981' },
    { id: 'devops',   name: 'DevOps',   color: '#f59e0b' },
    { id: 'qa',       name: 'QA',       color: '#ef4444' },
    { id: 'platform', name: 'Platform', color: '#8b5cf6' },
  ],
  clients: [
    { id: 'acme',     name: 'Acme Corp',         color: '#3b82f6' },
    { id: 'globex',   name: 'Globex',             color: '#10b981' },
    { id: 'initech',  name: 'Initech',            color: '#f59e0b' },
    { id: 'umbrella', name: 'Umbrella Co',        color: '#ef4444' },
    { id: 'stark',    name: 'Stark Industries',   color: '#8b5cf6' },
    { id: 'wayne',    name: 'Wayne Enterprises',  color: '#ec4899' },
  ],
  personal: [
    { id: 'family',   name: 'Family',          color: '#ef4444' },
    { id: 'friends',  name: 'Friends',         color: '#10b981' },
    { id: 'health',   name: 'Health & Fitness',color: '#f59e0b' },
    { id: 'projects', name: 'Side Projects',   color: '#8b5cf6' },
  ],
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const calendarId = searchParams.get('calendarId')
  const resources = calendarId ? (resourcesByCalendar[calendarId] ?? []) : []
  return Response.json(resources)
}
