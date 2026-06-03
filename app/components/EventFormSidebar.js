'use client'

import { useState, useEffect } from 'react'
import { XIcon } from 'lucide-react'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'

const EVENT_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'tentative', label: 'Tentative' },
  { value: 'on-hold', label: 'On Hold' },
  { value: 'postponed', label: 'Postponed' },
]

const DATE_STATUSES = [
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'tbd', label: 'TBD' },
  { value: 'tentative', label: 'Tentative' },
]

const CATEGORIES = [
  { value: 'meeting', label: 'Meeting' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'review', label: 'Review' },
  { value: 'training', label: 'Training' },
  { value: 'conference', label: 'Conference' },
  { value: 'other', label: 'Other' },
]

function splitDateTime(dtStr) {
  if (!dtStr) return { date: '', time: '' }
  const [date, time] = dtStr.split('T')
  return { date: date || '', time: time ? time.slice(0, 5) : '' }
}

function joinDateTime(date, time) {
  if (!date) return ''
  return time ? `${date}T${time}` : `${date}T00:00`
}

export default function EventFormSidebar({
  open,
  event,
  defaultStart,
  defaultEnd,
  defaultResourceId,
  resources,
  calendars,
  currentCalendarId,
  onSave,
  onClose,
  onDelete,
}) {
  const initStart = event?.start ?? defaultStart ?? ''
  const initEnd = event?.end ?? defaultEnd ?? ''
  const sp = splitDateTime(initStart)
  const ep = splitDateTime(initEnd)

  const [title, setTitle] = useState(event?.title ?? '')
  const [resourceId, setResourceId] = useState(event?.resourceId ?? defaultResourceId ?? resources[0]?.id ?? '')
  const [eventStatus, setEventStatus] = useState(event?.eventStatus ?? '')
  const [dateStatus, setDateStatus] = useState(event?.dateStatus ?? '')
  const [category, setCategory] = useState(event?.category ?? '')
  const [location, setLocation] = useState(event?.location ?? '')
  const [allDay, setAllDay] = useState(event?.allDay ?? false)
  const [startDate, setStartDate] = useState(sp.date)
  const [startTime, setStartTime] = useState(sp.time)
  const [endDate, setEndDate] = useState(ep.date)
  const [endTime, setEndTime] = useState(ep.time)
  const [cancelled, setCancelled] = useState(event?.cancelled ?? false)
  const [notes, setNotes] = useState(event?.notes ?? '')
  const [saving, setSaving] = useState(false)

  const otherCals = (calendars ?? []).filter(c => c.id !== currentCalendarId)
  const [shareTarget, setShareTarget] = useState(() => otherCals[0]?.id ?? '')
  const [shareStatus, setShareStatus] = useState(null)
  const [shareBusy, setShareBusy] = useState(false)
  const [shareEl, setShareEl] = useState(null)

  useEffect(() => {
    const s = splitDateTime(event?.start ?? defaultStart ?? '')
    const e = splitDateTime(event?.end ?? defaultEnd ?? '')
    setTitle(event?.title ?? '')
    setResourceId(event?.resourceId ?? defaultResourceId ?? resources[0]?.id ?? '')
    setEventStatus(event?.eventStatus ?? '')
    setDateStatus(event?.dateStatus ?? '')
    setCategory(event?.category ?? '')
    setLocation(event?.location ?? '')
    setAllDay(event?.allDay ?? false)
    setStartDate(s.date)
    setStartTime(s.time)
    setEndDate(e.date)
    setEndTime(e.time)
    setCancelled(event?.cancelled ?? false)
    setNotes(event?.notes ?? '')
    setShareStatus(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, defaultStart, defaultEnd, defaultResourceId])

  // Scroll the share section into view once both the event and DOM element are available.
  // Using a state-based callback ref so this re-runs when the element mounts inside the portal.
  useEffect(() => {
    if (!event?.id || !shareEl) return
    const scrollDiv = shareEl.closest('.overflow-y-auto')
    if (!scrollDiv) return
    const overshoot = shareEl.getBoundingClientRect().bottom - scrollDiv.getBoundingClientRect().bottom
    if (overshoot > 0) scrollDiv.scrollTop += overshoot + 16
  }, [event?.id, shareEl])

  const start = allDay ? startDate : joinDateTime(startDate, startTime)
  const end = allDay ? endDate : joinDateTime(endDate, endTime)
  const isValid = title.trim() && resourceId && category && startDate && endDate

  async function handleSubmit(e) {
    e.preventDefault()
    if (!isValid) return
    setSaving(true)
    try {
      const color = resources.find(r => r.id === resourceId)?.color
        ?? event?.color
        ?? '#3b82f6'
      await onSave({
        id: event?.id,
        title: title.trim(),
        start, end, color, resourceId,
        eventStatus: eventStatus || undefined,
        dateStatus: dateStatus || undefined,
        category,
        location: location || undefined,
        allDay: allDay || undefined,
        cancelled: cancelled || undefined,
        notes: notes || undefined,
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleShare() {
    if (!shareTarget || !event) return
    setShareBusy(true)
    setShareStatus(null)
    try {
      const res = await fetch('/api/shares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceEventId: event.id,
          sourceCalendarId: currentCalendarId,
          targetCalendarId: shareTarget,
          eventSnapshot: {
            title: event.title, start: event.start, end: event.end,
            color: event.color, resourceId: event.resourceId,
          },
        }),
      })
      if (!res.ok) throw new Error()
      setShareStatus('sent')
    } catch {
      setShareStatus('error')
    } finally {
      setShareBusy(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={isOpen => !isOpen && onClose()}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="flex flex-col p-0 sm:max-w-md gap-0"
      >
        {/* Header */}
        <SheetHeader className="flex flex-row items-center justify-between border-b px-6 py-4">
          <SheetTitle className="text-base">
            {event ? 'Edit Event' : 'New Event'}
          </SheetTitle>
          <Button variant="ghost" size="icon-sm" type="button" onClick={onClose}>
            <XIcon className="size-4" />
            <span className="sr-only">Close</span>
          </Button>
        </SheetHeader>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <form id="event-form" onSubmit={handleSubmit} className="space-y-5 px-6 py-5">

            {/* Event Name */}
            <div className="space-y-1.5">
              <Label htmlFor="ef-title">
                Event Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="ef-title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Event name"
                autoFocus
                required
              />
            </div>

            {/* Organization */}
            <div className="space-y-1.5">
              <Label>
                Organization <span className="text-destructive">*</span>
              </Label>
              <Select value={resourceId} onValueChange={setResourceId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select organization" />
                </SelectTrigger>
                <SelectContent>
                  {resources.map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <Label>
                Category <span className="text-destructive">*</span>
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Event Status */}
            <div className="space-y-1.5">
              <Label>Event Status</Label>
              <Select value={eventStatus || undefined} onValueChange={setEventStatus}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_STATUSES.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Status */}
            <div className="space-y-1.5">
              <Label>Date Status</Label>
              <Select value={dateStatus || undefined} onValueChange={setDateStatus}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select date status (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {DATE_STATUSES.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Location */}
            <div className="space-y-1.5">
              <Label htmlFor="ef-location">Location</Label>
              <Input
                id="ef-location"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="Location (optional)"
              />
            </div>

            <Separator />

            {/* All Day */}
            <div className="flex items-center gap-3">
              <Checkbox
                id="ef-allday"
                checked={allDay}
                onCheckedChange={setAllDay}
              />
              <Label htmlFor="ef-allday" className="cursor-pointer font-normal">
                All day event
              </Label>
            </div>

            {/* Start */}
            <div className="space-y-1.5">
              <Label>Start <span className="text-destructive">*</span></Label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="flex-1"
                  required
                />
                {!allDay && (
                  <Input
                    type="time"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    className="w-32"
                  />
                )}
              </div>
            </div>

            {/* End */}
            <div className="space-y-1.5">
              <Label>End <span className="text-destructive">*</span></Label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="flex-1"
                  required
                />
                {!allDay && (
                  <Input
                    type="time"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    className="w-32"
                  />
                )}
              </div>
            </div>

            {/* Event Cancelled */}
            <div className="flex items-center gap-3">
              <Checkbox
                id="ef-cancelled"
                checked={cancelled}
                onCheckedChange={setCancelled}
              />
              <Label htmlFor="ef-cancelled" className="cursor-pointer font-normal">
                Event cancelled
              </Label>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="ef-notes">Notes</Label>
              <Textarea
                id="ef-notes"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Add notes (optional)"
                rows={3}
              />
            </div>

            {/* Share to Calendar (edit mode only) */}
            {event && otherCals.length > 0 && (
              <>
                <Separator />
                <div ref={setShareEl} className="space-y-3 pb-2">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                    Share to Calendar
                  </Label>
                  {shareStatus === 'sent' ? (
                    <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs font-medium text-green-700">
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                        <path d="M2 6.5l3 3 6-6" stroke="#16a34a" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Added to approval queue
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Select value={shareTarget} onValueChange={setShareTarget}>
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {otherCals.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={handleShare}
                        disabled={shareBusy}
                      >
                        {shareBusy ? '…' : 'Share'}
                      </Button>
                    </div>
                  )}
                  {shareStatus === 'error' && (
                    <p className="text-xs text-destructive">Something went wrong. Try again.</p>
                  )}
                </div>
              </>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t px-6 py-4">
          {event && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => onDelete(event.id)}
              className="mr-auto"
            >
              Delete event
            </Button>
          )}
          <Button type="button" variant="outline" onClick={onClose}>
            Dismiss
          </Button>
          <Button
            type="submit"
            form="event-form"
            disabled={saving || !isValid}
          >
            {saving ? 'Saving…' : event ? 'Update' : 'Create'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
