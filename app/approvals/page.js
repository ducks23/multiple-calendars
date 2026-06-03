'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

function fmt(isoStr) {
  const d = new Date(isoStr)
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function fmtTime(isoStr) {
  return new Date(isoStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function fmtDate(isoStr) {
  return new Date(isoStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

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
  const [editingName, setEditingName] = useState(false)
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

  async function handleAction(shareId, action) {
    setProcessing(prev => ({ ...prev, [shareId]: true }))
    const share = shares.find(s => s.id === shareId)
    const resourceId = selectedOrg[shareId] || resources[share?.targetCalendarId]?.[0]?.id
    const res = await fetch('/api/shares', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
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
      className="h-screen flex flex-col bg-muted/30"
      style={{ fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)' }}
    >
      {/* Header */}
      <div className="bg-background border-b border-border px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-sm font-bold text-foreground">Approvals</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {shares.length === 0
              ? 'No pending requests'
              : `${shares.length} pending share request${shares.length > 1 ? 's' : ''}`}
          </p>
        </div>

        {/* Reviewer name */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Reviewing as</span>
          {editingName ? (
            <Input
              ref={nameRef}
              defaultValue={reviewerName}
              placeholder="Your name"
              className="h-7 w-32 text-xs"
              onBlur={e => saveName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') saveName(e.currentTarget.value) }}
            />
          ) : (
            <Button
              variant="secondary"
              size="xs"
              onClick={() => setEditingName(true)}
            >
              {reviewerName || 'Set name'}
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="ml-1">
                <path d="M7 1L9 3L3.5 8.5H1.5V6.5L7 1Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
              </svg>
            </Button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">

        {/* Pending queue */}
        <div className="flex-1 overflow-y-auto p-6">
          {shares.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-3">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M9 3v6l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-muted-foreground" />
                  <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground" />
                </svg>
              </div>
              <p className="text-sm font-medium text-muted-foreground">All caught up</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Share requests will appear here</p>
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
                  <div key={share.id} className="bg-background border border-border rounded-xl shadow-sm overflow-hidden">
                    {/* Event info */}
                    <div className="flex items-start gap-3 px-4 pt-4 pb-3">
                      <div
                        className="w-3 h-3 rounded-full mt-0.5 flex-shrink-0"
                        style={{ backgroundColor: snap.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground leading-tight">{snap.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {fmt(snap.start)} – {fmtTime(snap.end)}
                        </p>
                      </div>
                      <span className="text-[10px] font-medium text-muted-foreground flex-shrink-0">
                        {new Date(share.requestedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    {/* From → To */}
                    <div className="mx-4 mb-3 flex items-center gap-2 bg-muted/50 border border-border rounded-lg px-3 py-2">
                      <span className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground min-w-0">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: srcCal?.color }} />
                        <span className="truncate">{srcCal?.name}</span>
                      </span>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0 text-muted-foreground">
                        <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground min-w-0">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: tgtCal?.color }} />
                        <span className="truncate">{tgtCal?.name}</span>
                      </span>
                    </div>

                    {/* Assign to org */}
                    <div className="mx-4 mb-3">
                      <label className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wide">
                        Assign to organization in {tgtCal?.name ?? '…'}
                      </label>
                      {tgtRes.length > 0 ? (
                        <Select
                          value={currentOrg}
                          onValueChange={v => setSelectedOrg(prev => ({ ...prev, [share.id]: v }))}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {tgtRes.map(r => (
                              <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="h-8 bg-muted rounded-lg animate-pulse" />
                      )}
                    </div>

                    {/* Approve / Deny */}
                    <div className="flex gap-2 px-4 pb-4">
                      <Button
                        className="flex-1"
                        onClick={() => handleAction(share.id, 'approve')}
                        disabled={isBusy}
                      >
                        {isBusy ? '…' : '✓  Approve'}
                      </Button>
                      <Button
                        className="flex-1"
                        variant="secondary"
                        onClick={() => handleAction(share.id, 'deny')}
                        disabled={isBusy}
                      >
                        ✕  Deny
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <Separator orientation="vertical" />

        {/* History panel */}
        <div className="w-72 flex-shrink-0 overflow-y-auto bg-background">
          <div className="px-4 py-3 border-b border-border sticky top-0 bg-background z-10">
            <h2 className="text-xs font-bold text-foreground uppercase tracking-wide">History</h2>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {history.length} decision{history.length !== 1 ? 's' : ''}
            </p>
          </div>

          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <p className="text-xs text-muted-foreground">No decisions yet</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">Approved and denied requests will appear here</p>
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
                  <div key={share.id} className="bg-muted/40 border border-border rounded-lg px-3 py-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0">
                        <div
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-0.5"
                          style={{ backgroundColor: snap?.color }}
                        />
                        <p className="text-xs font-semibold text-foreground leading-tight truncate">{snap?.title}</p>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          'flex-shrink-0 text-[9px] px-1.5 py-0 h-4 font-bold uppercase tracking-wide rounded-full',
                          isApproved
                            ? 'border-green-200 bg-green-50 text-green-700'
                            : 'border-border bg-muted text-muted-foreground',
                        )}
                      >
                        {isApproved ? 'Approved' : 'Denied'}
                      </Badge>
                    </div>

                    {/* Source → Target */}
                    <div className="flex items-center gap-1 mt-1.5 ml-4">
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: srcCal?.color }} />
                        <span className="truncate">{srcCal?.name}</span>
                      </span>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-muted-foreground/40 flex-shrink-0">
                        <path d="M1 5h8M6 2l3 3-3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: tgtCal?.color }} />
                        <span className="truncate">{tgtCal?.name}</span>
                      </span>
                    </div>

                    {/* Reviewer + date */}
                    <div className="mt-1.5 ml-4 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-muted-foreground truncate">
                        {share.reviewedBy
                          ? <span className="font-semibold">{share.reviewedBy}</span>
                          : <span className="italic">Unknown</span>}
                      </span>
                      {decidedAt && (
                        <span className="text-[10px] text-muted-foreground flex-shrink-0">{fmtDate(decidedAt)}</span>
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
