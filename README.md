# Calendar App

A multi-calendar scheduling app built with Next.js 16 and React 19. Each calendar has its own set of organizations (resources), and events can be shared across calendars through an approval workflow.

## Getting Started

```bash
npm install
npm run dev   # http://localhost:3000
```

Other commands:

```bash
npm run build   # production build
npm run lint    # ESLint
```

## What It Does

- **Timeline calendar** — view and manage events on a resource-timeline (day or week), with one row per organization. Click anywhere on the timeline or drag a range to create an event; click an existing event to edit or delete it.
- **Multiple calendars** — Work, Team Sync, Client Meetings, and Personal, each with their own organizations and color scheme. Switch between them using the sidebar.
- **Event sharing** — while editing an event, share it to another calendar. This creates a pending share request rather than copying it directly.
- **Approvals queue** — reviewers visit the Approvals page to see all pending share requests. They choose which organization within the target calendar to assign the event to, then approve or deny. Approving creates a new event in the target calendar; denying discards the request.

## Architecture

**Stack:** Next.js 16 (App Router) · React 19 · FullCalendar (resource-timeline) · Tailwind CSS v4

**Data storage:** in-memory module-level objects in `app/api/_store.js`. All state is lost on server restart — this is intentional for a development/demo context.

### Routing

| Path | Description |
|---|---|
| `/` | Redirects to `/calendars/work` |
| `/calendars/[id]` | Timeline view for a specific calendar |
| `/approvals` | Pending share request inbox |

### Components

| File | Description |
|---|---|
| `app/layout.js` | Root HTML shell — fonts and viewport |
| `app/components/Sidebar.js` | Left nav with calendar links and approval badge |
| `app/components/CalendarLoader.js` | Disables SSR for FullCalendar (DOM dependency) |
| `app/components/Calendar.js` | FullCalendar resource-timeline view with full CRUD |
| `app/components/EventForm.js` | Modal form for create/edit/delete and share-to-calendar |
| `app/approvals/page.js` | Approval inbox — approve/deny share requests |

### API Routes

All routes live under `app/api/` and use in-memory storage.

| Method | Path | Description |
|---|---|---|
| GET | `/api/calendars` | List all calendars |
| GET | `/api/resources?calendarId=` | List organizations for a calendar |
| GET | `/api/events?calendarId=` | List events, optionally filtered by calendar |
| POST | `/api/events` | Create a new event |
| PATCH | `/api/events` | Update an existing event by id |
| DELETE | `/api/events?id=` | Delete an event by id |
| GET | `/api/shares?status=` | List share requests, optionally filtered by status |
| POST | `/api/shares` | Create a new (pending) share request |
| PATCH | `/api/shares` | Approve or deny a pending share request |

### Share Request Flow

1. User opens an existing event in `EventForm` and picks a target calendar, then clicks **Share**.
2. A POST to `/api/shares` creates a record with `status: "pending"` and an `eventSnapshot` of the event at that moment in time.
3. A reviewer opens the Approvals page, selects an organization in the target calendar, and clicks **Approve** or **Deny**.
4. A PATCH to `/api/shares` with `action: "approve"` creates a new event in the target calendar from the snapshot and marks the share `approved`. `action: "deny"` marks it `denied` with no event created.
