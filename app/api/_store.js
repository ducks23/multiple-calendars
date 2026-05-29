// Shared in-memory store — imported by both /api/events and /api/shares
// so that approving a share can write directly into the events dict.

function pad(n) { return String(n).padStart(2, '0') }

function toLocal(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function makeEvent(id, calendarId, resourceId, color, dayOffset, startH, startM, endH, endM, title) {
  const base = new Date(); base.setHours(0, 0, 0, 0); base.setDate(base.getDate() + dayOffset)
  const start = new Date(base); start.setHours(startH, startM, 0, 0)
  const end   = new Date(base); end.setHours(endH,   endM,   0, 0)
  return { id, calendarId, resourceId, color, title, start: toLocal(start), end: toLocal(end) }
}

// ES module live bindings are read-only for importers, so we expose
// the counters through functions rather than letting callers do ++.
let _nextEventId = 100
let _nextShareId = 1
export function nextEventId() { return String(_nextEventId++) }
export function nextShareId() { return `share_${_nextShareId++}` }

export const events = {
  // work
  'w1':  makeEvent('w1',  'work', 'eng',       '#3b82f6',  0,  9,  0, 10,  0, 'Sprint Planning'),
  'w2':  makeEvent('w2',  'work', 'eng',       '#3b82f6',  0, 15,  0, 16,  0, 'Code Review'),
  'w3':  makeEvent('w3',  'work', 'product',   '#8b5cf6',  0, 10,  0, 11, 30, 'Roadmap Review'),
  'w4':  makeEvent('w4',  'work', 'design',    '#f59e0b',  0, 11,  0, 12,  0, 'Design Critique'),
  'w5':  makeEvent('w5',  'work', 'sales',     '#ef4444',  0, 14,  0, 15,  0, 'Pipeline Review'),
  'w6':  makeEvent('w6',  'work', 'marketing', '#10b981',  0,  9, 30, 10, 30, 'Campaign Kickoff'),
  'w7':  makeEvent('w7',  'work', 'eng',       '#3b82f6', -1,  9,  0,  9, 30, 'Daily Standup'),
  'w8':  makeEvent('w8',  'work', 'product',   '#8b5cf6', -1, 13,  0, 14,  0, 'Feature Spec'),
  'w9':  makeEvent('w9',  'work', 'eng',       '#3b82f6',  1,  9,  0,  9, 30, 'Daily Standup'),
  'w10': makeEvent('w10', 'work', 'design',    '#f59e0b',  1, 14,  0, 15, 30, 'Brand Workshop'),
  // team
  't1':  makeEvent('t1',  'team', 'frontend', '#3b82f6',  0,  9,  0,  9, 30, 'Standup'),
  't2':  makeEvent('t2',  'team', 'backend',  '#10b981',  0, 10,  0, 11,  0, 'API Design'),
  't3':  makeEvent('t3',  'team', 'devops',   '#f59e0b',  0, 14,  0, 15,  0, 'Deploy Review'),
  't4':  makeEvent('t4',  'team', 'qa',       '#ef4444',  0, 11,  0, 12, 30, 'Test Planning'),
  't5':  makeEvent('t5',  'team', 'platform', '#8b5cf6',  0, 15,  0, 16,  0, 'Infra Sync'),
  't6':  makeEvent('t6',  'team', 'frontend', '#3b82f6', -1, 10,  0, 11, 30, 'Component Review'),
  't7':  makeEvent('t7',  'team', 'backend',  '#10b981',  1,  9,  0, 10,  0, 'DB Migration'),
  't8':  makeEvent('t8',  'team', 'qa',       '#ef4444',  1, 13,  0, 14,  0, 'Regression Run'),
  // clients
  'c1':  makeEvent('c1',  'clients', 'acme',     '#3b82f6',  0,  9,  0, 10,  0, 'Q2 Planning'),
  'c2':  makeEvent('c2',  'clients', 'acme',     '#3b82f6',  0, 14,  0, 15, 30, 'Sales Review'),
  'c3':  makeEvent('c3',  'clients', 'globex',   '#10b981',  0, 10,  0, 12,  0, 'Board Meeting'),
  'c4':  makeEvent('c4',  'clients', 'initech',  '#f59e0b',  0,  9,  0,  9, 30, 'TPS Reports Review'),
  'c5':  makeEvent('c5',  'clients', 'initech',  '#f59e0b',  0, 13,  0, 14,  0, 'IT Infrastructure'),
  'c6':  makeEvent('c6',  'clients', 'umbrella', '#ef4444',  0, 11,  0, 12,  0, 'Research Briefing'),
  'c7':  makeEvent('c7',  'clients', 'umbrella', '#ef4444',  0, 15, 30, 16, 30, 'Safety Committee'),
  'c8':  makeEvent('c8',  'clients', 'stark',    '#8b5cf6',  0, 10,  0, 10, 30, 'Investor Call'),
  'c9':  makeEvent('c9',  'clients', 'stark',    '#8b5cf6',  0, 15,  0, 16,  0, 'Product Demo'),
  'c10': makeEvent('c10', 'clients', 'wayne',    '#ec4899',  0, 14,  0, 15,  0, 'Strategy Session'),
  // personal
  'p1':  makeEvent('p1',  'personal', 'family',   '#ef4444',  0, 18,  0, 19, 30, 'Family Dinner'),
  'p2':  makeEvent('p2',  'personal', 'health',   '#f59e0b',  0,  7,  0,  8,  0, 'Morning Run'),
  'p3':  makeEvent('p3',  'personal', 'friends',  '#10b981',  0, 20,  0, 22,  0, 'Game Night'),
  'p4':  makeEvent('p4',  'personal', 'projects', '#8b5cf6',  0, 10,  0, 12,  0, 'Hackathon Prep'),
  'p5':  makeEvent('p5',  'personal', 'health',   '#f59e0b', -1,  6, 30,  7, 30, 'Gym'),
  'p6':  makeEvent('p6',  'personal', 'family',   '#ef4444',  1, 12,  0, 13, 30, 'Lunch with Mom'),
  'p7':  makeEvent('p7',  'personal', 'projects', '#8b5cf6',  1, 14,  0, 17,  0, 'Side Project'),
}

export const shares = {}
