'use client'

import { useState, useEffect } from 'react'

function fmt(isoStr) {
  const d = new Date(isoStr)
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', meridiem: 'short' })
}

function fmtTime(isoStr) {
  return new Date(isoStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export default function ApprovalsPage() {
  const [shares,      setShares]      = useState([])
  const [calendars,   setCalendars]   = useState({})   // { [id]: calendar }
  const [resources,   setResources]   = useState({})   // { [calendarId]: [resource] }
  const [selectedOrg, setSelectedOrg] = useState({})   // { [shareId]: resourceId }
  const [processing,  setProcessing]  = useState({})   // { [shareId]: bool }

  useEffect(() => {
    Promise.all([
      fetch('/api/shares?status=pending').then(r => r.json()),
      fetch('/api/calendars').then(r => r.json()),
    ]).then(([pending, calList]) => {
      setShares(pending)
      setCalendars(Object.fromEntries(calList.map(c => [c.id, c])))
    })
  }, [])

  // Lazily fetch resources for each target calendar that appears in the queue
  useEffect(() => {
    const needed = [...new Set(shares.map(s => s.targetCalendarId))].filter(id => !resources[id])
    needed.forEach(calId => {
      fetch(`/api/resources?calendarId=${calId}`)
        .then(r => r.json())
        .then(res => setResources(prev => ({ ...prev, [calId]: res })))
    })
  }, [shares])

  async function handleAction(shareId, action) {
    setProcessing(prev => ({ ...prev, [shareId]: true }))
    const resourceId = selectedOrg[shareId] ||
      (resources[shares.find(s => s.id === shareId)?.targetCalendarId]?.[0]?.id)
    await fetch('/api/shares', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id: shareId, action, resourceId }),
    })
    setShares(prev => prev.filter(s => s.id !== shareId))
  }

  return (
    <div
      className="h-screen overflow-y-auto bg-zinc-50"
      style={{ fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)' }}
    >
      {/* Page header */}
      <div className="bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-sm font-bold text-zinc-900">Approvals</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            {shares.length === 0
              ? 'No pending requests'
              : `${shares.length} pending share request${shares.length > 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {/* Queue */}
      <div className="p-6">
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
              const srcCal      = calendars[share.sourceCalendarId]
              const tgtCal      = calendars[share.targetCalendarId]
              const tgtRes      = resources[share.targetCalendarId] || []
              const snap        = share.eventSnapshot
              const isBusy      = processing[share.id]
              const currentOrg  = selectedOrg[share.id] || tgtRes[0]?.id || ''

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

                  {/* Assign to org in target calendar — always shown */}
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
    </div>
  )
}
