import { redirect } from 'next/navigation'

/** Root route — immediately redirects to the default calendar view so `/` is never a dead end. */
export default function Home() {
  redirect('/calendars/work')
}
