import CalendarLoader from '../../components/CalendarLoader'

export default async function CalendarPage({ params }) {
  const { id } = await params
  return <CalendarLoader calendarId={id} />
}
