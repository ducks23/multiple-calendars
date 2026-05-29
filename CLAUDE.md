# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # start dev server (http://localhost:3000)
npm run build    # production build
npm run lint     # run ESLint
```

No test runner is configured yet.

## Architecture

This is a **Next.js 16 + React 19** app using the **App Router** (`app/` directory). It uses Tailwind CSS v4 for styling.

**File conventions inside `app/`:**
- `layout.js` — shared shell, rendered once per segment
- `page.js` — the UI for a route (must be default export)
- `route.js` — API endpoint (Route Handler); cannot coexist with `page.js` at the same segment
- `loading.js` — Suspense fallback shown while a page segment streams
- `error.js` — error boundary for a segment

## Breaking changes vs. older Next.js

This version has significant API changes. **Always read `node_modules/next/dist/docs/` before writing Next.js code.** Key differences:

### `params` and `searchParams` are Promises

```js
// WRONG (old)
export default function Page({ params }) {
  const { id } = params
}

// CORRECT
export default async function Page({ params }) {
  const { id } = await params
}
```

### Caching uses `use cache` directive, not `fetch` options

`fetch` is not cached by default. Use the `use cache` directive at the top of an async function or component body. The old `fetch(url, { cache: 'force-cache' })` / `next: { revalidate }` options are replaced by:

```js
import { cacheLife } from 'next/cache'

async function getData() {
  'use cache'
  cacheLife('hours')  // 'seconds' | 'minutes' | 'hours' | 'days' | 'weeks' | 'max'
  return db.query(...)
}
```

Enable Cache Components in `next.config.mjs` first:
```js
const nextConfig = { cacheComponents: true }
```

### Instant client-side navigation

To make a route navigate instantly (no loading flash on link clicks), every uncached async operation must be wrapped in a `<Suspense>` boundary local to that segment, and `params` must be resolved via `.then()` rather than awaited at the top level:

```js
export const unstable_instant = { prefetch: 'static' }

export default async function Page({ params }) {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      {params.then(({ id }) => <MyComponent id={id} />)}
    </Suspense>
  )
}
```

Without local Suspense boundaries, client navigations between sibling routes block on uncached fetches even if the root layout has a `<Suspense>`. Read `node_modules/next/dist/docs/01-app/02-guides/instant-navigation.md` before implementing multi-page navigation.

### Server vs. Client Components

All layouts and pages are **Server Components** by default. Add `'use client'` only when you need state, event handlers, effects, or browser APIs. Keep `'use client'` components as leaves — pass server-fetched data as props rather than re-fetching on the client.
