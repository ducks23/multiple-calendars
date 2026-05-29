import CalendarLoader from '../../components/CalendarLoader'

/** Dynamic route for a single calendar. Resolves the `id` param and passes it to CalendarLoader. */
export default async function CalendarPage({ params }) {
  const { id } = await params
  return <CalendarLoader calendarId={id} />
}
