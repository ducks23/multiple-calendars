# Project Tickets

---

## TICKET-001: Root Layout (`app/layout.js`)

**Description:**
The root HTML shell that wraps every page in the application. Responsible for loading the Geist Sans and Geist Mono fonts as CSS variables, setting page-level metadata, and applying viewport constraints so the app never overflows or scrolls at the document level.

**Acceptance Criteria:**
- [ ] `<html>` tag has `lang="en"` and both font CSS variables applied as classes
- [ ] `<body>` is full height and has `overflow-hidden` so no outer scrollbar appears
- [ ] Page `<title>` reads "Calendar" and meta description reads "Timeline calendar"
- [ ] Geist Sans and Geist Mono are loaded with the `latin` subset

**Tasks:**
- [ ] Import `Geist` and `Geist_Mono` from `next/font/google`
- [ ] Configure both fonts with `variable` and `subsets: ['latin']`
- [ ] Export `metadata` object with `title` and `description`
- [ ] Return an `<html>` element with font variable classes and `h-full antialiased`
- [ ] Render `{children}` inside a `<body>` with `h-full overflow-hidden`

---

## TICKET-002: Home Page (`app/page.js`)

**Description:**
The root route (`/`) serves no UI of its own. Its only job is to redirect visitors to the default calendar so the app always opens on a meaningful view rather than a blank page.

**Acceptance Criteria:**
- [ ] Navigating to `/` immediately redirects to `/calendars/work`
- [ ] No flash of content before the redirect
- [ ] The redirect is a server-side redirect (not a client-side navigation)

**Tasks:**
- [ ] Import `redirect` from `next/navigation`
- [ ] Call `redirect('/calendars/work')` as the entire function body — no JSX returned

---

## TICKET-003: Calendars Layout (`app/calendars/layout.js`)

**Description:**
The shared layout for all calendar routes (`/calendars/[id]`). Composes the Sidebar with the page content in a full-height flex row so the sidebar stays fixed while the main area fills the remainder.

**Acceptance Criteria:**
- [ ] Sidebar is rendered to the left of the main content area on every calendar route
- [ ] The layout is full viewport height with no scroll at this level
- [ ] The main content area takes all remaining width with `min-w-0` to prevent flex overflow

**Tasks:**
- [ ] Import `Sidebar` from `../components/Sidebar`
- [ ] Return a `flex h-screen overflow-hidden` wrapper
- [ ] Render `<Sidebar />` then a `<main>` with `flex-1 overflow-hidden min-w-0`
- [ ] Pass `{children}` inside `<main>`

---

## TICKET-004: Approvals Layout (`app/approvals/layout.js`)

**Description:**
The shared layout for the approvals section (`/approvals`). Identical in structure to the calendars layout — renders the Sidebar alongside the approvals page content.

**Acceptance Criteria:**
- [ ] Sidebar is rendered to the left of the approvals content
- [ ] The layout is full viewport height with no outer scroll
- [ ] The main content area fills remaining width with `min-w-0`

**Tasks:**
- [ ] Import `Sidebar` from `../components/Sidebar`
- [ ] Return a `flex h-screen overflow-hidden` wrapper
- [ ] Render `<Sidebar />` then a `<main>` with `flex-1 overflow-hidden min-w-0`
- [ ] Pass `{children}` inside `<main>`

---

## TICKET-005: Calendar Page (`app/calendars/[id]/page.js`)

**Description:**
The dynamic route that renders a specific calendar by ID. Resolves the `id` route parameter using the async `params` API introduced in Next.js 16, then hands it off to `CalendarLoader`.

**Acceptance Criteria:**
- [ ] Route renders for any valid calendar ID (e.g. `/calendars/work`, `/calendars/personal`)
- [ ] `params` is awaited before destructuring (Next.js 16 requirement — params is a Promise)
- [ ] The extracted `id` is passed as `calendarId` to `CalendarLoader`

**Tasks:**
- [ ] Mark the component `async`
- [ ] `await params` and destructure `id`
- [ ] Import `CalendarLoader` from `../../components/CalendarLoader`
- [ ] Return `<CalendarLoader calendarId={id} />`

---

## TICKET-006: Sidebar Component (`app/components/Sidebar.js`)

**Description:**
The persistent left-hand navigation. Renders the app name, an "Approvals" link with a live pending-count badge, and a link for each calendar with its color swatch. Fetches the calendar list and pending share count on mount, and re-fetches the pending count on every route change so the badge stays accurate after the user processes approvals.

**Acceptance Criteria:**
- [ ] App name "Calendar" appears at the top
- [ ] "Approvals" link appears under a "Manage" section heading
- [ ] Badge on the Approvals link shows the current number of pending share requests; hidden when count is zero
- [ ] Badge re-fetches on every `pathname` change so it updates after the user approves or denies items
- [ ] Each calendar is listed under "My Calendars" with a colored dot and its name
- [ ] The active route's link is highlighted with a white background and bold text
- [ ] Sidebar is 220px wide, uses Geist Sans font variable

**Tasks:**
- [ ] Fetch `/api/calendars` on mount and store in `calendars` state
- [ ] Fetch `/api/shares?status=pending` on mount and on each `pathname` change; store count in `pendingCount` state
- [ ] Use `usePathname()` from `next/navigation` to detect the active route
- [ ] Implement `navLink(href, label, badge)` helper that renders an active-aware `<Link>` with optional badge
- [ ] Map `calendars` array to per-calendar `<Link>` elements with color dot
- [ ] Apply active styles (`bg-white shadow-sm font-semibold`) vs inactive styles (`text-zinc-500 hover:bg-white`)

---

## TICKET-007: Calendar Loader Component (`app/components/CalendarLoader.js`)

**Description:**
A thin client-component wrapper whose sole purpose is to dynamically import `CalendarView` with SSR disabled. FullCalendar accesses the DOM at module initialisation time, which causes a crash if Next.js attempts to render it on the server. The SSR disable must live inside a `'use client'` component per Next.js 16 rules.

**Acceptance Criteria:**
- [ ] `CalendarView` is never rendered on the server
- [ ] `CalendarLoader` itself is a client component (`'use client'`)
- [ ] `calendarId` prop is forwarded to `CalendarView` unchanged
- [ ] No loading fallback is needed (the timeline handles its own loading state)

**Tasks:**
- [ ] Add `'use client'` directive
- [ ] Use `next/dynamic` to import `./Calendar` with `{ ssr: false }`
- [ ] Accept `calendarId` prop and pass it directly to the dynamically loaded `CalendarView`

---

## TICKET-008: Calendar View Component (`app/components/Calendar.js`)

**Description:**
The main interactive timeline view for a single calendar. On mount (and whenever `calendarId` changes) it fetches the calendar's resources, its events, and the full calendar list in parallel. It renders a FullCalendar resource-timeline with Day, Week, and Month view options. Drag-selecting a time range opens `EventForm` for creation; clicking an existing event opens it for editing.

**Acceptance Criteria:**
- [ ] Resources, events, and all calendars are fetched in a single `Promise.all` when `calendarId` changes; stale data is cleared before the fetch completes
- [ ] FullCalendar renders with `resourceTimelineDay` as the initial view
- [ ] Header toolbar shows: prev/next/today on the left, title in the center, and "+ New Event / Day / Week / Month" on the right
- [ ] Organizations column header reads "Organization" and is 180px wide
- [ ] Timeline starts scrolled to 08:00; slot duration is 30 minutes; slots are labelled every hour
- [ ] A current-time indicator (`nowIndicator`) is visible
- [ ] Drag-selecting a slot opens `EventForm` pre-filled with the selected start, end, and resource
- [ ] Clicking "+ New Event" opens `EventForm` pre-filled with the current hour and the first resource
- [ ] Clicking an event opens `EventForm` in edit mode with that event's data
- [ ] Saving a new event via `EventForm` calls `POST /api/events` and merges the result into local state
- [ ] Saving an edited event calls `PATCH /api/events` and updates local state
- [ ] Deleting an event calls `DELETE /api/events?id=` and removes it from local state
- [ ] `EventForm` is closed after any save or delete

**Tasks:**
- [ ] Implement `pad(n)` and `toLocal(date)` helpers for building `datetime-local` strings
- [ ] Set up state: `events` (object keyed by id), `resources` (array), `calendars` (array), `formState` (null or slot/event descriptor)
- [ ] `useEffect` on `calendarId`: clear state, then `Promise.all` three fetches
- [ ] Derive `fcResources` and `fcEvents` arrays from state for FullCalendar
- [ ] Implement `openNewEventForm`, `handleSelect`, `handleEventClick`
- [ ] Implement `handleSave` (branches on presence of `id` for POST vs PATCH)
- [ ] Implement `handleDelete`
- [ ] Wire FullCalendar props: `plugins`, `initialView`, `schedulerLicenseKey`, `resources`, `events`, `customButtons`, `headerToolbar`, `views`, `selectable`, `selectMirror`, `select`, `eventClick`, `height`, `scrollTime`, `nowIndicator`, `slotDuration`, `slotLabelInterval`, `resourceAreaHeaderContent`, `resourceAreaWidth`, `eventTimeFormat`
- [ ] Conditionally render `<EventForm>` when `formState` is non-null, passing all required props

---

## TICKET-009: Event Form Component (`app/components/EventForm.js`)

**Description:**
A modal overlay for creating and editing events. In create mode it collects title, organization (resource), start/end datetimes, and color. In edit mode it also shows a "Delete event" button and a "Share to Calendar" section. The share section lets the user select a target calendar and submit a share request to the approvals queue; it replaces itself with a confirmation banner on success.

**Acceptance Criteria:**
- [ ] Modal opens with focus on the title input
- [ ] Clicking the backdrop (but not the modal itself) closes the form
- [ ] Title is required; Save button is disabled until title, start, end, and resourceId all have values
- [ ] Organization dropdown auto-selects the first resource; selecting a different org updates the event color (in create mode only)
- [ ] Color picker shows 8 swatches; the active color has a ring and is scaled up
- [ ] "Delete event" link is shown only in edit mode; it calls `onDelete` with the event id
- [ ] "Share to Calendar" section is shown only in edit mode and only when other calendars exist
- [ ] Clicking Share posts to `POST /api/shares` with `sourceEventId`, `sourceCalendarId`, `targetCalendarId`, and `eventSnapshot` (title, start, end, color, resourceId)
- [ ] On share success the section is replaced by a green "Added to approval queue" confirmation
- [ ] On share failure a red error message is shown with a retry option
- [ ] `onSave` is called with `{ id, title, start, end, color, resourceId }` on form submit

**Tasks:**
- [ ] Define `COLORS` array of 8 hex values
- [ ] Define shared Tailwind class strings (`labelCls`, `inputCls`, `selectCls`, `smallInputCls`)
- [ ] Initialise state from props: `title`, `start`, `end`, `resourceId`, `color`, `saving`
- [ ] Initialise share state: `shareTarget`, `shareStatus`, `shareBusy`
- [ ] `useRef` + `useEffect` to auto-focus the title input on open
- [ ] `handleSubmit`: prevent default, guard required fields, call `onSave`, manage `saving` flag
- [ ] `handleShare`: POST to `/api/shares`, set `shareStatus` to `'sent'` or `'error'`
- [ ] Render modal backdrop with click-outside-to-close
- [ ] Render header with "New Event" / "Edit Event" title and close button
- [ ] Render form fields: title input, organization select, start/end grid, color picker
- [ ] Render save/cancel/delete row
- [ ] Conditionally render share section below a divider in edit mode

---

## TICKET-010: Approvals Page (`app/approvals/page.js`)

**Description:**
The approvals inbox. The page is split into two panels: the left shows all pending share requests and the right shows a history of all decided requests. On mount it fetches all shares and all calendars in one parallel call, splits them into pending and history (history sorted newest-first), then lazily fetches resources for each target calendar that appears in the pending queue. The reviewer identifies themselves via an inline-editable name chip in the header, persisted to `localStorage`. Approving or denying a request calls `PATCH /api/shares`, then moves the card from the pending list into the history panel in real time.

**Acceptance Criteria:**
- [ ] Pending queue and history panel are shown side-by-side; each scrolls independently
- [ ] All shares are fetched in a single call on mount; pending and history are split client-side
- [ ] History is sorted newest-first by `approvedAt` / `deniedAt` / `requestedAt`
- [ ] Resources for each target calendar are fetched lazily when that calendar appears in the pending list; a pulse skeleton is shown until they load
- [ ] "Reviewing as" chip in the header shows the saved name; clicking it reveals an input; blur or Enter saves it to `localStorage` under key `approvals_reviewer_name`
- [ ] Reviewer name is initialised from `localStorage` via lazy `useState` (no `useEffect` setState)
- [ ] Each pending card shows: event color dot, title, formatted date range, request date, source→target banner, org picker, Approve and Deny buttons
- [ ] Approve/Deny buttons are disabled while the request is in flight
- [ ] Approved card disappears from pending and appears at the top of history with a green "Approved" badge
- [ ] Denied card disappears from pending and appears at the top of history with a grey "Denied" badge
- [ ] History cards show: event color dot, title, Approved/Denied badge, source→target, reviewer name, decision date
- [ ] Empty state for pending shows a clock icon and "All caught up" message
- [ ] Empty state for history shows "No decisions yet"
- [ ] History panel header shows a decision count subtitle

**Tasks:**
- [ ] Implement `fmt(isoStr)`, `fmtTime(isoStr)`, `fmtDate(isoStr)` formatting helpers
- [ ] Set up state: `shares`, `history`, `calendars`, `resources`, `selectedOrg`, `processing`, `reviewerName`, `editingName`
- [ ] Initialise `reviewerName` lazily from `localStorage` with a `typeof window` guard
- [ ] `useEffect` on mount: `Promise.all` for `/api/shares` and `/api/calendars`; split and sort results
- [ ] `useEffect` on `[editingName]`: focus `nameRef` when editing starts
- [ ] `useEffect` on `[shares, resources]`: compute missing calendar IDs and fetch their resources
- [ ] `saveName(name)`: trim, set state, write to `localStorage`, exit editing mode
- [ ] `handleAction(shareId, action)`: mark processing, POST PATCH with `reviewerName`, move card to history
- [ ] Render full-height flex-column layout with fixed header and scrollable body
- [ ] Render reviewer name chip (button mode / input mode)
- [ ] Render left panel: empty state or list of pending cards
- [ ] Render `w-px` divider
- [ ] Render right panel: sticky header with count, empty state or list of history cards

---

## TICKET-011: In-Memory Data Store (`app/api/_store.js`)

**Description:**
The single source of truth for all runtime data. Exports a mutable `events` object and a mutable `shares` object that are shared across API route handlers. Also exports `nextEventId()` and `nextShareId()` counter functions. Seed data covers four calendars worth of events spanning yesterday, today, and tomorrow, plus three pre-resolved share history entries.

**Acceptance Criteria:**
- [ ] `events` is a plain object keyed by event ID; each value has `id`, `calendarId`, `resourceId`, `color`, `title`, `start`, `end`
- [ ] `shares` is a plain object keyed by share ID; pre-seeded with 2 approved and 1 denied history entry
- [ ] `nextEventId()` returns a string ID starting at `"100"` and increments on each call
- [ ] `nextShareId()` returns a string ID in the format `"share_N"` starting at `"share_1"` and increments on each call
- [ ] Seed events span `dayOffset` values of `-1`, `0`, and `+1` so today always has data regardless of when the app is started
- [ ] IDs of pre-seeded events and share history entries do not collide with auto-generated IDs

**Tasks:**
- [ ] Implement `pad(n)` and `toLocal(date)` helpers for formatting seed timestamps
- [ ] Implement `makeEvent(id, calendarId, resourceId, color, dayOffset, startH, startM, endH, endM, title)` factory
- [ ] Declare `let _nextEventId = 100` and `let _nextShareId = 1`; export `nextEventId()` and `nextShareId()` as functions (not the raw counters, which are read-only live bindings)
- [ ] Export `events` object seeded with events for `work` (w1–w10), `team` (t1–t8), `clients` (c1–c10), and `personal` (p1–p7)
- [ ] Export `shares` object seeded with `share_hist_1` (approved), `share_hist_2` (denied), `share_hist_3` (approved), each with a fixed ISO `requestedAt` and `reviewedBy`

---

## TICKET-012: GET `/api/calendars`

**Description:**
Returns the static list of all calendars. Each calendar has an `id`, `name`, and `color`. Used by the Sidebar to populate the navigation links, by `CalendarView` to populate the share target dropdown in `EventForm`, and by `ApprovalsPage` to resolve calendar names and colors for the pending and history cards.

**Acceptance Criteria:**
- [ ] Returns a JSON array of all four calendars: Work, Team Sync, Client Meetings, Personal
- [ ] Each item has `id` (string), `name` (string), and `color` (hex string)
- [ ] Response status is 200
- [ ] No request body or query parameters are required

**Tasks:**
- [ ] Define the `calendars` array as a module-level constant with the four entries
- [ ] Export an `async function GET()` that returns `Response.json(calendars)`

---

## TICKET-013: GET `/api/resources`

**Description:**
Returns the list of resources (organisations) for a given calendar. Used by `CalendarView` to populate the timeline rows and the organization dropdown in `EventForm`, and by `ApprovalsPage` to populate the org assignment picker on approval cards.

**Acceptance Criteria:**
- [ ] Requires a `calendarId` query parameter
- [ ] Returns a JSON array of resources for the given calendar; each has `id`, `name`, and `color`
- [ ] Returns an empty array if `calendarId` is omitted or does not match any known calendar
- [ ] Response status is 200 in all cases (no 404 for unknown calendar)

**Tasks:**
- [ ] Define `resourcesByCalendar` as a module-level object keyed by calendar ID, with arrays of `{ id, name, color }` for each of the four calendars
- [ ] Export `async function GET(request)` that reads `calendarId` from `searchParams`
- [ ] Return `resourcesByCalendar[calendarId] ?? []`

---

## TICKET-014: GET `/api/events`

**Description:**
Returns all events from the store, or only those belonging to a specific calendar when `calendarId` is provided. Used by `CalendarView` on mount to populate the timeline for the active calendar.

**Acceptance Criteria:**
- [ ] Without `calendarId`: returns all events as a JSON object keyed by event ID
- [ ] With `calendarId`: returns only events whose `calendarId` matches, as a JSON object keyed by event ID
- [ ] Response status is 200
- [ ] Each event has `id`, `calendarId`, `resourceId`, `color`, `title`, `start`, `end`

**Tasks:**
- [ ] Import `events` from `../_store.js`
- [ ] Export `async function GET(request)` that reads `calendarId` from `searchParams`
- [ ] Filter `Object.entries(events)` when `calendarId` is present and rebuild with `Object.fromEntries`
- [ ] Return the full `events` object when no filter is applied

---

## TICKET-015: POST `/api/events`

**Description:**
Creates a new event. Accepts a JSON body with event fields, assigns a generated ID, writes it to the store, and returns the created event. Called by `CalendarView.handleSave` when creating a new event from `EventForm`.

**Acceptance Criteria:**
- [ ] Accepts a JSON body with at minimum `title`, `start`, `end`, `calendarId`, `resourceId`, and `color`
- [ ] Assigns a unique auto-incremented string ID via `nextEventId()`
- [ ] Writes the new event to the `events` store object
- [ ] Returns the created event as JSON with status 201
- [ ] The returned event includes the generated `id`

**Tasks:**
- [ ] Import `events` and `nextEventId` from `../_store.js`
- [ ] Export `async function POST(request)` that parses the JSON body
- [ ] Call `nextEventId()`, write `{ ...body, id }` to `events[id]`
- [ ] Return `Response.json(events[id], { status: 201 })`

---

## TICKET-016: PATCH `/api/events`

**Description:**
Partially updates an existing event. Accepts a JSON body with an `id` field plus any fields to update. Used by `CalendarView.handleSave` when saving edits from `EventForm`.

**Acceptance Criteria:**
- [ ] Accepts a JSON body with `id` and any subset of event fields to update
- [ ] Returns 404 with `{ error: 'Not found' }` if the `id` does not exist in the store
- [ ] Merges the update fields onto the existing event (does not replace it wholesale)
- [ ] Returns the updated event as JSON with status 200

**Tasks:**
- [ ] Import `events` from `../_store.js`
- [ ] Export `async function PATCH(request)` that parses the JSON body
- [ ] Destructure `id` and spread remaining fields as `updates`
- [ ] Return 404 if `events[id]` is undefined
- [ ] Merge: `events[id] = { ...events[id], ...updates }`
- [ ] Return `Response.json(events[id])`

---

## TICKET-017: DELETE `/api/events`

**Description:**
Deletes a single event by ID. The ID is passed as a query parameter rather than a request body since DELETE requests conventionally have no body. Returns 204 on success. Used by `CalendarView.handleDelete`.

**Acceptance Criteria:**
- [ ] Reads the event `id` from the `id` query parameter
- [ ] Returns 404 with `{ error: 'Not found' }` if the ID does not exist
- [ ] Deletes the event from the store
- [ ] Returns an empty response with status 204 on success

**Tasks:**
- [ ] Import `events` from `../_store.js`
- [ ] Export `async function DELETE(request)` that reads `id` from `searchParams`
- [ ] Return 404 if `events[id]` is undefined
- [ ] `delete events[id]`
- [ ] Return `new Response(null, { status: 204 })`

---

## TICKET-018: GET `/api/shares`

**Description:**
Returns share requests from the store. Supports an optional `status` query parameter to filter by `pending`, `approved`, or `denied`. Used by `ApprovalsPage` (fetches all, splits client-side) and by `Sidebar` (fetches `?status=pending` to compute the badge count).

**Acceptance Criteria:**
- [ ] Without `status`: returns all share requests as a JSON array
- [ ] With `status`: returns only requests whose `status` matches
- [ ] Response status is 200
- [ ] Each share has at minimum `id`, `status`, `sourceCalendarId`, `targetCalendarId`, `eventSnapshot`, `requestedAt`
- [ ] Approved shares also have `approvedAt`, `newEventId`, `reviewedBy`
- [ ] Denied shares also have `deniedAt`, `reviewedBy`

**Tasks:**
- [ ] Import `shares` from `../_store.js`
- [ ] Export `async function GET(request)` that reads `status` from `searchParams`
- [ ] Convert `Object.values(shares)` to an array
- [ ] Filter by `status` if present, otherwise return all
- [ ] Return `Response.json(list)`

---

## TICKET-019: POST `/api/shares`

**Description:**
Creates a new share request in `pending` status. Called by `EventForm.handleShare` when the user submits the Share section. Stores a snapshot of the event at the time of the request so approval cards show the original data even if the source event is later edited.

**Acceptance Criteria:**
- [ ] Accepts a JSON body with `sourceEventId`, `sourceCalendarId`, `targetCalendarId`, and `eventSnapshot`
- [ ] `eventSnapshot` contains `title`, `start`, `end`, `color`, and `resourceId`
- [ ] Assigns a unique auto-incremented ID via `nextShareId()` in the format `"share_N"`
- [ ] Writes the record with `status: 'pending'` and `requestedAt` set to the current ISO timestamp
- [ ] Returns the created share record as JSON with status 201

**Tasks:**
- [ ] Import `shares` and `nextShareId` from `../_store.js`
- [ ] Export `async function POST(request)` that parses the JSON body
- [ ] Call `nextShareId()`, build the share object with all required fields plus `requestedAt: new Date().toISOString()` and `status: 'pending'`
- [ ] Write to `shares[id]`
- [ ] Return `Response.json(shares[id], { status: 201 })`

---

## TICKET-020: PATCH `/api/shares`

**Description:**
Processes a pending share request by approving or denying it. On approval, copies the event snapshot into the target calendar as a new event (with an optional `resourceId` override) and records `approvedAt` and `newEventId`. On denial, records `deniedAt`. Both actions record `reviewedBy`. Returns 404 for unknown IDs and 400 if the share has already been processed.

**Acceptance Criteria:**
- [ ] Accepts a JSON body with `id`, `action` (`"approve"` or `"deny"`), optional `resourceId`, and optional `reviewerName`
- [ ] Returns 404 with `{ error: 'Not found' }` if the share ID does not exist
- [ ] Returns 400 with `{ error: 'Already processed' }` if the share's status is not `pending`
- [ ] On `approve`: creates a new event in `events` from the share's `eventSnapshot`, using `targetCalendarId` and the provided `resourceId`; sets share `status` to `'approved'`, records `approvedAt`, `newEventId`, and `reviewedBy`
- [ ] On `deny`: sets share `status` to `'denied'`, records `deniedAt` and `reviewedBy`
- [ ] `reviewedBy` is stored as `null` if no `reviewerName` is provided
- [ ] Returns the updated share record as JSON with status 200

**Tasks:**
- [ ] Import `events`, `shares`, `nextEventId` from `../_store.js`
- [ ] Export `async function PATCH(request)` that parses the JSON body
- [ ] Destructure `id`, `action`, `resourceId`, `reviewerName`
- [ ] Guard: return 404 if `shares[id]` is falsy
- [ ] Guard: return 400 if `shares[id].status !== 'pending'`
- [ ] Approve branch: call `nextEventId()`, build and write new event to `events[newId]`, update share fields
- [ ] Deny branch: update share `status`, `deniedAt`, `reviewedBy`
- [ ] Return `Response.json(shares[id])`
