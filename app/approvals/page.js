'use client'

import { useState, useEffect, useRef } from 'react'

/** Formats an ISO timestamp as a readable date + time string (e.g. "Mon, Jan 6 · 2:30 PM"). */
function fmt(isoStr) {
  const d = new Date(isoStr)
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', meridiem: 'short' })
}

/** Formats an ISO timestamp as a short time string (e.g. "3:45 PM"). */
function fmtTime(isoStr) {
  return new Date(isoStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

/** Formats an ISO timestamp as a short date (e.g. "May 29"). */
function fmtDate(isoStr) {
  return new Date(isoStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/**
 * Approvals inbox with a history panel.
 * Left side: pending share requests to review.
 * Right side: history of approved/denied shares with reviewer names.
 * The reviewer's name is set via an inline input in the header and persisted in localStorage.
 */
export default function ApprovalsPage() {
  const [shares,       setShares]       = useState([])
  const [history,      setHistory]      = useState([])
  const [calendars,    setCalendars]    = useState({})
  const [resources,    setResources]    = useState({})
  const [selectedOrg,  setSelectedOrg]  = useState({})
  const [processing,   setProcessing]   = useState({})
  const [reviewerName, setReviewerName] = useState(() =>
    typeof window !== 'undefined' ? (localStorage.getItem('approvals_reviewer_name') || '') : ''
  )
  const [editingName,  setEditingName]  = useState(false)
  const nameRef = useRef(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/shares').then(r => r.json()),
      fetch('/api/calendars').then(r => r.json()),
    ]).then(([allShares, calList]) => {
      setShares(allShares.filter(s => s.status === 'pending'))
      setHistory(
        allShares
          .filter(s => s.status !== 'pending')
          .sort((a, b) => {
            const ta = a.approvedAt || a.deniedAt || a.requestedAt
            const tb = b.approvedAt || b.deniedAt || b.requestedAt
            return new Date(tb) - new Date(ta)
          })
      )
      setCalendars(Object.fromEntries(calList.map(c => [c.id, c])))
    })
  }, [])

  useEffect(() => {
    if (editingName) nameRef.current?.focus()
  }, [editingName])

  // Lazily fetch resources for each target calendar that appears in the queue
  useEffect(() => {
    const needed = [...new Set(shares.map(s => s.targetCalendarId))].filter(id => !resources[id])
    needed.forEach(calId => {
      fetch(`/api/resources?calendarId=${calId}`)
        .then(r => r.json())
        .then(res => setResources(prev => ({ ...prev, [calId]: res })))
    })
  }, [shares, resources])

  function saveName(name) {
    const trimmed = name.trim()
    setReviewerName(trimmed)
    if (trimmed) localStorage.setItem('approvals_reviewer_name', trimmed)
    setEditingName(false)
  }

  /** Sends an approve or deny PATCH to the shares API, then moves the card to the history panel. */
  async function handleAction(shareId, action) {
    setProcessing(prev => ({ ...prev, [shareId]: true }))
    const share = shares.find(s => s.id === shareId)
    const resourceId = selectedOrg[shareId] || resources[share?.targetCalendarId]?.[0]?.id
    const res = await fetch('/api/shares', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        id: shareId, action, resourceId,
        reviewerName: reviewerName.trim() || 'Unknown',
      }),
    })
    const updated = await res.json()
    setShares(prev => prev.filter(s => s.id !== shareId))
    setHistory(prev => [updated, ...prev])
  }

  return (
    <div
      className="h-screen flex flex-col bg-zinc-50"
      style={{ fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)' }}
    >
      {/* Page header */}
      <div className="bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-sm font-bold text-zinc-900">Approvals</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            {shares.length === 0
              ? 'No pending requests'
              : `${shares.length} pending share request${shares.length > 1 ? 's' : ''}`}
          </p>
        </div>

        {/* Reviewer name */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">Reviewing as</span>
          {editingName ? (
            <input
              ref={nameRef}
              defaultValue={reviewerName}
              placeholder="Your name"
              className="px-2 py-1 text-xs text-zinc-900 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-32"
              onBlur={e => saveName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') saveName(e.currentTarget.value) }}
            />
          ) : (
            <button
              onClick={() => setEditingName(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-zinc-800 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors"
            >
              {reviewerName || 'Set name'}
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M7 1L9 3L3.5 8.5H1.5V6.5L7 1Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">

        {/* Pending queue */}
        <div className="flex-1 overflow-y-auto p-6">
          {shares.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center mb-3">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M9 3v6l4 2" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx="9" cy="9" r="7" stroke="#9ca3af" strokeWidth="1.5" />
                </svg>
              </div>
              <p className="text-sm font-medium text-zinc-500">All caught up</p>
              <p className="text-xs text-zinc-400 mt-1">Share requests will appear here</p>
            </div>
          ) : (
            <div className="space-y-3 max-w-xl">
              {shares.map(share => {
                const srcCal     = calendars[share.sourceCalendarId]
                const tgtCal     = calendars[share.targetCalendarId]
                const tgtRes     = resources[share.targetCalendarId] || []
                const snap       = share.eventSnapshot
                const isBusy     = processing[share.id]
                const currentOrg = selectedOrg[share.id] || tgtRes[0]?.id || ''

                return (
                  <div key={share.id} className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">

                    {/* Event info row */}
                    <div className="flex items-start gap-3 px-4 pt-4 pb-3">
                      <div
                        className="w-3 h-3 rounded-full mt-0.5 flex-shrink-0"
                        style={{ backgroundColor: snap.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-zinc-900 leading-tight">{snap.title}</p>
                        <p className="text-xs text-zinc-600 mt-0.5">
                          {fmt(snap.start)} – {fmtTime(snap.end)}
                        </p>
                      </div>
                      <span className="text-[10px] font-medium text-zinc-500 flex-shrink-0">
                        {new Date(share.requestedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    {/* From → To banner */}
                    <div className="mx-4 mb-3 flex items-center gap-2 bg-zinc-50 border border-zinc-100 rounded-lg px-3 py-2">
                      <span className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-700 min-w-0">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: srcCal?.color }} />
                        <span className="truncate">{srcCal?.name}</span>
                      </span>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0 text-zinc-400">
                        <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-700 min-w-0">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: tgtCal?.color }} />
                        <span className="truncate">{tgtCal?.name}</span>
                      </span>
                    </div>

                    {/* Assign to org */}
                    <div className="mx-4 mb-3">
                      <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase tracking-wide">
                        Assign to organization in {tgtCal?.name ?? '…'}
                      </label>
                      {tgtRes.length > 0 ? (
                        <select
                          value={currentOrg}
                          onChange={e => setSelectedOrg(prev => ({ ...prev, [share.id]: e.target.value }))}
                          className="w-full px-2.5 py-2 text-sm text-zinc-900 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                          {tgtRes.map(r => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                          ))}
                        </select>
                      ) : (
                        <div className="h-9 bg-zinc-100 rounded-lg animate-pulse" />
                      )}
                    </div>

                    {/* Approve / Deny */}
                    <div className="flex gap-2 px-4 pb-4">
                      <button
                        onClick={() => handleAction(share.id, 'approve')}
                        disabled={isBusy}
                        className="flex-1 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-40 transition-colors"
                      >
                        {isBusy ? '…' : '✓  Approve'}
                      </button>
                      <button
                        onClick={() => handleAction(share.id, 'deny')}
                        disabled={isBusy}
                        className="flex-1 py-2 text-xs font-semibold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-lg disabled:opacity-40 transition-colors"
                      >
                        ✕  Deny
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-px bg-zinc-200 flex-shrink-0" />

        {/* History panel */}
        <div className="w-72 flex-shrink-0 overflow-y-auto bg-white">
          <div className="px-4 py-3 border-b border-zinc-100 sticky top-0 bg-white z-10">
            <h2 className="text-xs font-bold text-zinc-900 uppercase tracking-wide">History</h2>
            <p className="text-[10px] text-zinc-400 mt-0.5">
              {history.length} decision{history.length !== 1 ? 's' : ''}
            </p>
          </div>

          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <p className="text-xs text-zinc-400">No decisions yet</p>
              <p className="text-[10px] text-zinc-300 mt-1">Approved and denied requests will appear here</p>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {history.map(share => {
                const srcCal     = calendars[share.sourceCalendarId]
                const tgtCal     = calendars[share.targetCalendarId]
                const snap       = share.eventSnapshot
                const isApproved = share.status === 'approved'
                const decidedAt  = share.approvedAt || share.deniedAt

                return (
                  <div key={share.id} className="bg-zinc-50 border border-zinc-100 rounded-lg px-3 py-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0">
                        <div
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-0.5"
                          style={{ backgroundColor: snap?.color }}
                        />
                        <p className="text-xs font-semibold text-zinc-800 leading-tight truncate">{snap?.title}</p>
                      </div>
                      <span className={[
                        'flex-shrink-0 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full',
                        isApproved
                          ? 'bg-green-100 text-green-700'
                          : 'bg-zinc-200 text-zinc-500',
                      ].join(' ')}>
                        {isApproved ? 'Approved' : 'Denied'}
                      </span>
                    </div>

                    {/* Source → Target */}
                    <div className="flex items-center gap-1 mt-1.5 ml-4">
                      <span className="flex items-center gap-1 text-[10px] text-zinc-500">
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: srcCal?.color }} />
                        <span className="truncate">{srcCal?.name}</span>
                      </span>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-zinc-300 flex-shrink-0">
                        <path d="M1 5h8M6 2l3 3-3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="flex items-center gap-1 text-[10px] text-zinc-500">
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: tgtCal?.color }} />
                        <span className="truncate">{tgtCal?.name}</span>
                      </span>
                    </div>

                    {/* Reviewer + date */}
                    <div className="mt-1.5 ml-4 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-zinc-400 truncate">
                        {share.reviewedBy
                          ? <span className="font-semibold text-zinc-500">{share.reviewedBy}</span>
                          : <span className="italic">Unknown</span>}
                      </span>
                      {decidedAt && (
                        <span className="text-[10px] text-zinc-400 flex-shrink-0">{fmtDate(decidedAt)}</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
