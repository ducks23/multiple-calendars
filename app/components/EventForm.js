'use client'

import { useState, useEffect, useRef } from 'react'

const COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#06b6d4', '#f97316',
]

export default function EventForm({
  event,
  defaultStart, defaultEnd,
  defaultResourceId, defaultColor,
  resources,
  calendars,
  currentCalendarId,
  onSave, onClose, onDelete,
}) {
  const [title,      setTitle]      = useState(event?.title ?? '')
  const [start,      setStart]      = useState(event?.start ?? defaultStart ?? '')
  const [end,        setEnd]        = useState(event?.end   ?? defaultEnd   ?? '')
  const [resourceId, setResourceId] = useState(event?.resourceId ?? defaultResourceId ?? resources[0]?.id ?? '')
  const [color,      setColor]      = useState(event?.color ?? defaultColor ?? COLORS[0])
  const [saving,     setSaving]     = useState(false)

  // Share-to-calendar state — initialize synchronously so the first click works
  const otherCals  = (calendars ?? []).filter(c => c.id !== currentCalendarId)
  const [shareTarget, setShareTarget] = useState(() => otherCals[0]?.id ?? '')
  const [shareStatus, setShareStatus] = useState(null) // null | 'sent' | 'error'
  const [shareBusy,   setShareBusy]   = useState(false)

  const titleRef = useRef(null)
  useEffect(() => { titleRef.current?.focus() }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim() || !start || !end || !resourceId) return
    setSaving(true)
    try {
      await onSave({ id: event?.id, title: title.trim(), start, end, color, resourceId })
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
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceEventId:    event.id,
          sourceCalendarId: currentCalendarId,
          targetCalendarId: shareTarget,
          eventSnapshot: {
            title: event.title,
            start: event.start,
            end:   event.end,
            color: event.color,
            resourceId: event.resourceId,
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      style={{ backdropFilter: 'blur(2px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-sm mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
          <h2 className="text-sm font-semibold text-zinc-900">
            {event ? 'Edit Event' : 'New Event'}
          </h2>
          <button type="button" onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100"
            aria-label="Close"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 pt-4 pb-5 space-y-4">
          {/* Title */}
          <input
            ref={titleRef}
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Event title"
            className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-zinc-400"
            required
          />

          {/* Organization */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
              Organization
            </label>
            <select
              value={resourceId}
              onChange={e => {
                setResourceId(e.target.value)
                const res = resources.find(r => r.id === e.target.value)
                if (res && !event) setColor(res.color)
              }}
              className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              required
            >
              {resources.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>

          {/* Start / End */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">Start</label>
              <input type="datetime-local" value={start} onChange={e => setStart(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">End</label>
              <input type="datetime-local" value={end} onChange={e => setEnd(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required />
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-2 uppercase tracking-wider">Color</label>
            <div className="flex gap-2.5">
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className="w-6 h-6 rounded-full transition-transform"
                  style={{
                    backgroundColor: c,
                    boxShadow: color === c ? `0 0 0 2px white, 0 0 0 3.5px ${c}` : 'none',
                    transform: color === c ? 'scale(1.2)' : 'scale(1)',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Save / Delete row */}
          <div className="flex items-center justify-between pt-1">
            {event
              ? <button type="button" onClick={() => onDelete(event.id)}
                  className="text-xs font-medium text-red-500 hover:text-red-700">Delete event</button>
              : <span />}
            <div className="flex gap-2">
              <button type="button" onClick={onClose}
                className="px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 rounded-lg">Cancel</button>
              <button type="submit"
                disabled={saving || !title.trim() || !start || !end || !resourceId}
                className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-40">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>

          {/* ── Share to another calendar (edit mode only) ───────────────── */}
          {event && otherCals.length > 0 && (
            <div className="border-t border-zinc-100 pt-4 space-y-2">
              <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Share to Calendar
              </p>

              {shareStatus === 'sent' ? (
                <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <path d="M2 6.5l3 3 6-6" stroke="#16a34a" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-xs font-medium text-green-700">Added to approval queue</span>
                </div>
              ) : (
                <div className="flex gap-2">
                  <select
                    value={shareTarget}
                    onChange={e => setShareTarget(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {otherCals.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleShare}
                    disabled={shareBusy}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg disabled:opacity-40 whitespace-nowrap"
                  >
                    {shareBusy ? '…' : 'Share'}
                  </button>
                </div>
              )}

              {shareStatus === 'error' && (
                <p className="text-xs text-red-500">Something went wrong. Try again.</p>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
