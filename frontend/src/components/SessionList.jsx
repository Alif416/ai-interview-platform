import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const STATUS_CFG = {
  SCHEDULED:   { label: 'Scheduled',   cls: 'lc-badge-blue',   dot: '#60a5fa', pulse: false },
  IN_PROGRESS: { label: 'In Progress', cls: 'lc-badge-medium', dot: '#ffc01e', pulse: true  },
  COMPLETED:   { label: 'Completed',   cls: 'lc-badge-easy',   dot: '#00b8a3', pulse: false },
  CANCELLED:   { label: 'Cancelled',   cls: 'lc-badge-hard',   dot: '#ff375f', pulse: false },
}

const FILTERS = ['All', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
const FILTER_LABELS = {
  All: 'All', SCHEDULED: 'Scheduled', IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed', CANCELLED: 'Cancelled',
}

function StatusDot({ status }) {
  const s = STATUS_CFG[status] || { dot: '#808080', pulse: false }
  return (
    <span className="relative flex items-center justify-center w-4 h-4">
      {s.pulse && (
        <span
          className="absolute inline-flex w-full h-full rounded-full opacity-50 animate-ping"
          style={{ backgroundColor: s.dot }}
        />
      )}
      <span className="relative w-2 h-2 rounded-full" style={{ backgroundColor: s.dot }} />
    </span>
  )
}

export default function SessionList() {
  const navigate = useNavigate()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [filter, setFilter]     = useState('All')
  const [search, setSearch]     = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const res  = await fetch('http://localhost:3000/api/v1/sessions')
        const json = await res.json()
        if (json.success) setSessions(json.data.sessions)
        else setError('Failed to load sessions')
      } catch {
        setError('Cannot connect to server')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const visible = sessions.filter(s => {
    const matchFilter = filter === 'All' || s.status === filter
    const matchSearch = !search || s.title.toLowerCase().includes(search.toLowerCase()) || s.role.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  /* ── Loading ──────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-32">
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--lc-border)', borderTopColor: 'var(--lc-orange)' }}
        />
        <p className="text-xs" style={{ color: 'var(--lc-muted)' }}>Loading sessions…</p>
      </div>
    )
  }

  /* ── Error ────────────────────────────────────────────────────── */
  if (error) {
    return (
      <div
        className="flex items-center gap-3 px-5 py-4 rounded-xl text-sm max-w-lg mx-auto mt-12"
        style={{ backgroundColor: 'var(--lc-error-dim)', border: '1px solid rgba(255,55,95,0.3)', color: 'var(--lc-error)' }}
      >
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div>
          <p className="font-medium">Connection error</p>
          <p className="text-xs mt-0.5 opacity-70">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* ── Toolbar ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        {/* Left: title + counts */}
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-base" style={{ color: 'var(--lc-text)' }}>
            Interview Sessions
          </h2>
          <span
            className="px-2 py-0.5 rounded-full text-xs"
            style={{ backgroundColor: 'var(--lc-surface-3)', color: 'var(--lc-text-3)' }}
          >
            {sessions.length}
          </span>
        </div>

        {/* Right: search + filter */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--lc-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search sessions…"
              className="lc-input pl-8"
              style={{ padding: '6px 12px 6px 30px', width: '200px' }}
            />
          </div>
        </div>
      </div>

      {/* ── Filter pills (like LeetCode difficulty filter) ───────── */}
      <div className="flex items-center gap-1.5 mb-4 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-3 py-1 rounded-full text-xs font-medium border transition-all"
            style={{
              backgroundColor: filter === f ? 'var(--lc-orange-dim)' : 'transparent',
              borderColor: filter === f ? 'var(--lc-orange)' : 'var(--lc-border)',
              color: filter === f ? 'var(--lc-orange)' : 'var(--lc-text-3)',
            }}
          >
            {FILTER_LABELS[f]}
            {f !== 'All' && (
              <span className="ml-1 opacity-60">
                {sessions.filter(s => s.status === f).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Table ───────────────────────────────────────────────── */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ backgroundColor: 'var(--lc-surface)', borderColor: 'var(--lc-border)' }}
      >
        {/* Header row */}
        <div
          className="grid text-xs font-medium px-5 py-2.5 border-b"
          style={{
            gridTemplateColumns: '28px 1fr 140px 60px 140px 110px 90px',
            color: 'var(--lc-text-3)',
            borderColor: 'var(--lc-border)',
            backgroundColor: 'var(--lc-surface-2)',
          }}
        >
          <span />
          <span>Title</span>
          <span>Role</span>
          <span>Level</span>
          <span>Candidate</span>
          <span>Status</span>
          <span>Room</span>
        </div>

        {/* Empty state */}
        {visible.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <svg className="w-10 h-10" style={{ color: 'var(--lc-border-2)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm" style={{ color: 'var(--lc-muted)' }}>
              {search || filter !== 'All' ? 'No sessions match your filter' : 'No sessions yet'}
            </p>
          </div>
        )}

        {/* Data rows */}
        {visible.map((session, i) => {
          const s = STATUS_CFG[session.status] || { label: session.status, cls: 'lc-badge-blue', pulse: false }
          return (
            <div
              key={session.id}
              className="grid items-center px-5 py-3 border-b text-sm transition-colors"
              style={{
                gridTemplateColumns: '28px 1fr 140px 60px 140px 110px 90px',
                borderColor: 'var(--lc-border)',
                backgroundColor: 'transparent',
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--lc-surface-2)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              {/* Status dot */}
              <StatusDot status={session.status} />

              {/* Title */}
              <span className="font-medium pr-4 truncate" style={{ color: 'var(--lc-text)' }}>
                {session.title}
              </span>

              {/* Role */}
              <span className="truncate text-xs" style={{ color: 'var(--lc-text-3)' }}>
                {session.role}
              </span>

              {/* Level badge */}
              <span>
                <span
                  className="px-1.5 py-0.5 rounded text-xs font-mono"
                  style={{ backgroundColor: 'var(--lc-surface-3)', color: 'var(--lc-orange)' }}
                >
                  {session.level}
                </span>
              </span>

              {/* Candidate */}
              <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--lc-text-3)' }}>
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ backgroundColor: 'rgba(255,161,22,0.12)', color: 'var(--lc-orange)' }}
                >
                  {session.candidate?.name?.charAt(0)?.toUpperCase() || '?'}
                </span>
                {session.candidate?.name}
              </span>

              {/* Status badge */}
              <span className={`lc-badge ${s.cls}`}>{s.label}</span>

              {/* Join Room */}
              <button
                onClick={() => navigate(`/room/${session.id}`)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                style={{
                  backgroundColor: 'var(--lc-orange-dim)',
                  color: 'var(--lc-orange)',
                  border: '1px solid rgba(255,161,22,0.25)',
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,161,22,0.25)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--lc-orange-dim)'}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.882V15.118a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Join
              </button>
            </div>
          )
        })}
      </div>

      {/* Row count */}
      {visible.length > 0 && (
        <p className="text-xs mt-3" style={{ color: 'var(--lc-text-3)' }}>
          Showing {visible.length} of {sessions.length} sessions
        </p>
      )}
    </div>
  )
}
