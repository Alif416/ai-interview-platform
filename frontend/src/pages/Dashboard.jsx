import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AIInterview from './AIInterview'
import PerformanceChart from '../components/PerformanceChart'
import api from '../api/axios'

function LCLogo({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 95 111" fill="none">
      <path d="M68.0,84.0 L35.0,84.0 C26.7,84.0 20.0,77.3 20.0,69.0 L20.0,42.0 C20.0,33.7 26.7,27.0 35.0,27.0 L68.0,27.0" stroke="#ffa116" strokeWidth="9" strokeLinecap="round"/>
      <path d="M48.0,13.0 L48.0,98.0" stroke="#b3b3b3" strokeWidth="9" strokeLinecap="round"/>
      <path d="M28.0,55.5 L68.0,55.5" stroke="#b3b3b3" strokeWidth="9" strokeLinecap="round"/>
    </svg>
  )
}

const ROLE_BADGE = {
  ADMIN:       { label: 'Admin',       bg: 'rgba(255,55,95,0.15)',   color: '#ff375f' },
  INTERVIEWER: { label: 'Interviewer', bg: 'rgba(96,165,250,0.15)',  color: '#60a5fa' },
  CANDIDATE:   { label: 'Candidate',   bg: 'rgba(0,184,163,0.15)',   color: '#00b8a3' },
}

const DIFF_CFG = {
  EASY:   { label: 'Easy',   color: '#00b8a3', bg: 'rgba(0,184,163,0.12)' },
  MEDIUM: { label: 'Medium', color: '#ffc01e', bg: 'rgba(255,192,30,0.12)' },
  HARD:   { label: 'Hard',   color: '#ff375f', bg: 'rgba(255,55,95,0.12)' },
}

const STATUS_CFG = {
  SCHEDULED:   { label: 'Scheduled',   cls: 'lc-badge-blue',   dot: '#60a5fa', pulse: false },
  IN_PROGRESS: { label: 'In Progress', cls: 'lc-badge-medium', dot: '#ffc01e', pulse: true  },
  COMPLETED:   { label: 'Completed',   cls: 'lc-badge-easy',   dot: '#00b8a3', pulse: false },
  CANCELLED:   { label: 'Cancelled',   cls: 'lc-badge-hard',   dot: '#ff375f', pulse: false },
}

const NAV_TABS = [
  {
    id: 'problems',
    label: 'Problems',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    id: 'live',
    label: 'Live Rooms',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.882V15.118a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
    badge: true,
  },
  {
    id: 'ai',
    label: 'AI Interview',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
  {
    id: 'performance',
    label: 'Performance',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
]

// ─── Problems List ────────────────────────────────────────────────────────────

const DIFF_FILTERS = ['All', 'EASY', 'MEDIUM', 'HARD']

const PAGE_SIZE = 20

function ProblemsPanel() {
  const [problems, setProblems]     = useState([])
  const [total, setTotal]           = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage]             = useState(1)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [diffFilter, setDiffFilter] = useState('All')
  const [search, setSearch]         = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [syncing, setSyncing]       = useState(false)
  const [syncResult, setSyncResult] = useState(null)

  // Debounce search input → search state
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1) }, 400)
    return () => clearTimeout(t)
  }, [searchInput])

  // Reset to page 1 when filter changes
  useEffect(() => { setPage(1) }, [diffFilter])

  const loadProblems = useCallback((pg, diff, srch) => {
    setLoading(true)
    setError(null)
    const params = new URLSearchParams({ page: pg, limit: PAGE_SIZE })
    if (diff !== 'All') params.set('difficulty', diff)
    if (srch) params.set('search', srch)
    api.get(`/problems?${params}`)
      .then(res => {
        const d = res.data.data
        setProblems(d.problems)
        setTotal(d.total)
        setTotalPages(d.totalPages)
      })
      .catch(() => setError('Failed to load problems'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { loadProblems(page, diffFilter, search) }, [page, diffFilter, search, loadProblems])

  const syncNeetcode = async () => {
    setSyncing(true)
    setSyncResult(null)
    try {
      const { data } = await api.post('/problems/sync')
      setSyncResult({ ok: true, message: data.message })
      loadProblems(1, diffFilter, search)
      setPage(1)
    } catch (e) {
      setSyncResult({ ok: false, message: e.response?.data?.message || 'Sync failed' })
    } finally {
      setSyncing(false)
    }
  }

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
          <p className="font-medium">Failed to load problems</p>
          <p className="text-xs mt-0.5 opacity-70">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="font-semibold text-base" style={{ color: 'var(--lc-text)' }}>Problem Set</h2>
          <span
            className="px-2 py-0.5 rounded-full text-xs"
            style={{ backgroundColor: 'var(--lc-surface-3)', color: 'var(--lc-text-3)' }}
          >
            {total}
          </span>
          <button
            onClick={syncNeetcode}
            disabled={syncing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              backgroundColor: syncing ? 'var(--lc-surface-3)' : 'var(--lc-orange-dim)',
              color: syncing ? 'var(--lc-muted)' : 'var(--lc-orange)',
              border: '1px solid rgba(255,161,22,0.3)',
              cursor: syncing ? 'not-allowed' : 'pointer',
            }}
          >
            {syncing ? (
              <>
                <div className="w-3 h-3 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--lc-muted)', borderTopColor: 'var(--lc-orange)' }} />
                Syncing NeetCode 250…
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Sync NeetCode 250
              </>
            )}
          </button>
          {syncResult && (
            <span className="text-xs" style={{ color: syncResult.ok ? 'var(--lc-easy)' : 'var(--lc-hard)' }}>
              {syncResult.message}
            </span>
          )}
        </div>
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
            style={{ color: 'var(--lc-muted)' }}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search by title or tag…"
            className="lc-input pl-8"
            style={{ padding: '6px 12px 6px 30px', width: '220px' }}
          />
        </div>
      </div>

      {/* Difficulty filter */}
      <div className="flex items-center gap-1.5 mb-4">
        {DIFF_FILTERS.map(f => {
          const d = DIFF_CFG[f]
          return (
            <button
              key={f}
              onClick={() => setDiffFilter(f)}
              className="px-3 py-1 rounded-full text-xs font-medium border transition-all"
              style={{
                backgroundColor: diffFilter === f ? (d ? d.bg : 'var(--lc-orange-dim)') : 'transparent',
                borderColor:     diffFilter === f ? (d ? d.color : 'var(--lc-orange)') : 'var(--lc-border)',
                color:           diffFilter === f ? (d ? d.color : 'var(--lc-orange)') : 'var(--lc-text-3)',
              }}
            >
              {f === 'All' ? 'All' : DIFF_CFG[f].label}
            </button>
          )
        })}
      </div>

      {/* Table */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ backgroundColor: 'var(--lc-surface)', borderColor: 'var(--lc-border)' }}
      >
        {/* Header */}
        <div
          className="grid text-xs font-medium px-5 py-2.5 border-b"
          style={{
            gridTemplateColumns: '44px 1fr 100px auto',
            color: 'var(--lc-text-3)',
            borderColor: 'var(--lc-border)',
            backgroundColor: 'var(--lc-surface-2)',
          }}
        >
          <span>#</span>
          <span>Title</span>
          <span>Difficulty</span>
          <span>Tags</span>
        </div>

        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="grid items-center px-5 py-3.5 border-b last:border-b-0"
              style={{ gridTemplateColumns: '44px 1fr 100px auto', borderColor: 'var(--lc-border)' }}
            >
              <div className="w-5 h-3 rounded animate-pulse" style={{ backgroundColor: 'var(--lc-surface-3)' }} />
              <div
                className="h-3.5 rounded animate-pulse mr-4"
                style={{ backgroundColor: 'var(--lc-surface-3)', width: `${[55, 40, 65, 48, 70, 44, 60, 52][i]}%` }}
              />
              <div className="w-14 h-5 rounded-full animate-pulse" style={{ backgroundColor: 'var(--lc-surface-3)' }} />
              <div className="flex gap-1.5">
                <div className="w-12 h-4 rounded animate-pulse hidden sm:block" style={{ backgroundColor: 'var(--lc-surface-3)' }} />
                <div className="w-10 h-4 rounded animate-pulse hidden sm:block" style={{ backgroundColor: 'var(--lc-surface-3)' }} />
              </div>
            </div>
          ))
        ) : problems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <svg className="w-10 h-10" style={{ color: 'var(--lc-border-2)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm" style={{ color: 'var(--lc-muted)' }}>No problems match your filter</p>
          </div>
        ) : (
          problems.map((p, i) => {
            const d = DIFF_CFG[p.difficulty] || DIFF_CFG.EASY
            return (
              <div
                key={p.id}
                className="grid items-center px-5 py-3.5 border-b last:border-b-0 text-sm transition-colors cursor-default"
                style={{ gridTemplateColumns: '44px 1fr 100px auto', borderColor: 'var(--lc-border)' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--lc-surface-2)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <span className="text-xs font-mono" style={{ color: 'var(--lc-muted)' }}>
                  {(page - 1) * PAGE_SIZE + i + 1}.
                </span>
                <span className="font-medium pr-4 truncate" style={{ color: 'var(--lc-text)' }}>
                  {p.title}
                </span>
                <span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: d.bg, color: d.color }}>
                    {d.label}
                  </span>
                </span>
                <div className="flex gap-1 flex-wrap">
                  {p.tags?.slice(0, 3).map(tag => (
                    <span key={tag} className="text-xs px-1.5 py-0.5 rounded hidden sm:inline"
                      style={{ backgroundColor: 'var(--lc-surface-3)', color: 'var(--lc-text-3)' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs" style={{ color: 'var(--lc-text-3)' }}>
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total} problems
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                backgroundColor: 'var(--lc-surface-2)',
                color: page === 1 ? 'var(--lc-muted)' : 'var(--lc-text-2)',
                border: '1px solid var(--lc-border)',
                cursor: page === 1 ? 'not-allowed' : 'pointer',
              }}
            >
              ← Prev
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 2, totalPages - 4))
              const pg = start + i
              return (
                <button
                  key={pg}
                  onClick={() => setPage(pg)}
                  className="w-8 h-8 rounded-lg text-xs font-medium transition-all"
                  style={{
                    backgroundColor: pg === page ? 'var(--lc-orange)' : 'var(--lc-surface-2)',
                    color: pg === page ? '#1a1a1a' : 'var(--lc-text-3)',
                    border: `1px solid ${pg === page ? 'var(--lc-orange)' : 'var(--lc-border)'}`,
                  }}
                >
                  {pg}
                </button>
              )
            })}

            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                backgroundColor: 'var(--lc-surface-2)',
                color: page === totalPages ? 'var(--lc-muted)' : 'var(--lc-text-2)',
                border: '1px solid var(--lc-border)',
                cursor: page === totalPages ? 'not-allowed' : 'pointer',
              }}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Live Rooms Panel ─────────────────────────────────────────────────────────

const BLANK_FORM = { title: '', candidateUsername: '', role: '', level: 'L4', scheduledAt: '' }

function SessionCard({ session, navigate, isInterviewer }) {
  const s = STATUS_CFG[session.status] || STATUS_CFG.SCHEDULED
  const isLive = session.status === 'IN_PROGRESS'
  const person = isInterviewer ? session.candidate : session.interviewer
  const personLabel = isInterviewer ? 'Candidate' : 'Interviewer'

  return (
    <div
      className="rounded-xl border p-4 flex items-center gap-4 transition-all"
      style={{
        backgroundColor: 'var(--lc-surface)',
        borderColor: isLive ? 'rgba(255,192,30,0.3)' : 'var(--lc-border)',
        boxShadow: isLive ? '0 0 0 1px rgba(255,192,30,0.1)' : 'none',
      }}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--lc-surface-2)'}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--lc-surface)'}
    >
      <span className="relative flex w-2.5 h-2.5 shrink-0">
        {s.pulse && (
          <span className="absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping" style={{ backgroundColor: s.dot }} />
        )}
        <span className="relative w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.dot }} />
      </span>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-medium truncate" style={{ color: 'var(--lc-text)' }}>{session.title}</span>
          <span className={`lc-badge ${s.cls} shrink-0`}>{s.label}</span>
        </div>
        <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--lc-text-3)' }}>
          <span>{session.role}</span>
          <span className="px-1.5 py-0.5 rounded font-mono" style={{ backgroundColor: 'var(--lc-surface-3)', color: 'var(--lc-orange)' }}>
            {session.level}
          </span>
          {person && (
            <span className="flex items-center gap-1">
              <span className="w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ backgroundColor: 'rgba(255,161,22,0.15)', color: 'var(--lc-orange)' }}>
                {person.name?.charAt(0)?.toUpperCase() || '?'}
              </span>
              <span>{personLabel}: </span>
              <span style={{ color: 'var(--lc-text-2)' }}>{person.name}</span>
              <span style={{ color: 'var(--lc-muted)' }}>@{person.username}</span>
            </span>
          )}
        </div>
      </div>

      <button
        onClick={() => navigate(`/room/${session.id}`)}
        className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all"
        style={{
          backgroundColor: isLive ? '#ffc01e' : 'var(--lc-orange-dim)',
          color: isLive ? '#1a1a1a' : 'var(--lc-orange)',
          border: isLive ? 'none' : '1px solid rgba(255,161,22,0.3)',
        }}
        onMouseEnter={e => !isLive && (e.currentTarget.style.backgroundColor = 'rgba(255,161,22,0.25)')}
        onMouseLeave={e => !isLive && (e.currentTarget.style.backgroundColor = 'var(--lc-orange-dim)')}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.882V15.118a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        {isLive ? 'Join Live' : 'Join Room'}
      </button>
    </div>
  )
}

function LiveRoomsPanel({ navigate, userRole }) {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('All')

  // Create session form (interviewer only)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(BLANK_FORM)
  const [formError, setFormError] = useState('')
  const [creating, setCreating] = useState(false)

  const isInterviewer = userRole === 'INTERVIEWER' || userRole === 'ADMIN'

  const loadSessions = () => {
    setLoading(true)
    api.get('/sessions')
      .then(res => { if (res.data.success) setSessions(res.data.data.sessions) })
      .catch(() => setError('Failed to load sessions. Check your connection and try again.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadSessions() }, [])

  const FILTERS = ['All', 'IN_PROGRESS', 'SCHEDULED']
  const FILTER_LABELS = { All: 'All', IN_PROGRESS: 'Live Now', SCHEDULED: 'Upcoming' }

  const visible = sessions.filter(s => filter === 'All' || s.status === filter)
  const liveCount = sessions.filter(s => s.status === 'IN_PROGRESS').length

  const handleCreate = async (e) => {
    e.preventDefault()
    setFormError('')
    setCreating(true)
    try {
      await api.post('/sessions', {
        title: form.title,
        candidateUsername: form.candidateUsername.toLowerCase(),
        role: form.role,
        level: form.level,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
      })
      setForm(BLANK_FORM)
      setShowForm(false)
      loadSessions()
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create session')
    } finally {
      setCreating(false)
    }
  }

  const LEVELS = ['L3', 'L4', 'L5', 'L6', 'L7']

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-base" style={{ color: 'var(--lc-text)' }}>
            {isInterviewer ? 'Live Interview Rooms' : 'Interview Invitations'}
          </h2>
          <p className="text-xs mt-1" style={{ color: 'var(--lc-text-3)' }}>
            {isInterviewer
              ? 'Create sessions and invite candidates by their username.'
              : 'Sessions you have been invited to appear here.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {liveCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
              style={{ backgroundColor: 'rgba(255,192,30,0.12)', color: '#ffc01e', border: '1px solid rgba(255,192,30,0.3)' }}>
              <span className="relative flex w-1.5 h-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping" style={{ backgroundColor: '#ffc01e' }} />
                <span className="relative w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#ffc01e' }} />
              </span>
              {liveCount} Live
            </div>
          )}
          {isInterviewer && (
            <button
              onClick={() => { setShowForm(v => !v); setFormError('') }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                backgroundColor: showForm ? 'var(--lc-orange)' : 'var(--lc-orange-dim)',
                color: showForm ? '#1a1a1a' : 'var(--lc-orange)',
                border: '1px solid rgba(255,161,22,0.3)',
              }}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showForm ? 'M6 18L18 6M6 6l12 12' : 'M12 4v16m8-8H4'} />
              </svg>
              {showForm ? 'Cancel' : 'New Session'}
            </button>
          )}
        </div>
      </div>

      {/* Create session form (interviewer only) */}
      {isInterviewer && showForm && (
        <div className="rounded-xl border p-5 flex flex-col gap-4"
          style={{ backgroundColor: 'var(--lc-surface)', borderColor: 'rgba(255,161,22,0.3)' }}>
          <p className="text-xs font-semibold" style={{ color: 'var(--lc-text-2)' }}>Create Interview Session</p>
          {formError && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
              style={{ backgroundColor: 'var(--lc-error-dim)', border: '1px solid rgba(255,55,95,0.3)', color: 'var(--lc-error)' }}>
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {formError}
            </div>
          )}
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--lc-text-3)' }}>Session Title</label>
              <input
                required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Frontend Engineer Interview"
                className="lc-input w-full" style={{ padding: '7px 12px' }}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--lc-text-3)' }}>Candidate Username</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium select-none" style={{ color: 'var(--lc-muted)' }}>@</span>
                <input
                  required value={form.candidateUsername}
                  onChange={e => setForm({ ...form, candidateUsername: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                  placeholder="john_doe"
                  className="lc-input w-full" style={{ padding: '7px 12px 7px 24px' }}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--lc-text-3)' }}>Role / Position</label>
              <input
                required value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                placeholder="e.g. Frontend Engineer"
                className="lc-input w-full" style={{ padding: '7px 12px' }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--lc-text-3)' }}>Level</label>
              <div className="flex gap-1.5 flex-wrap">
                {LEVELS.map(l => (
                  <button key={l} type="button" onClick={() => setForm({ ...form, level: l })}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
                    style={{
                      backgroundColor: form.level === l ? 'var(--lc-orange-dim)' : 'transparent',
                      borderColor: form.level === l ? 'var(--lc-orange)' : 'var(--lc-border)',
                      color: form.level === l ? 'var(--lc-orange)' : 'var(--lc-text-3)',
                    }}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--lc-text-3)' }}>Scheduled Date & Time</label>
              <input
                required type="datetime-local" value={form.scheduledAt}
                onChange={e => setForm({ ...form, scheduledAt: e.target.value })}
                className="lc-input w-full" style={{ padding: '7px 12px', colorScheme: 'dark' }}
              />
            </div>
            <div className="sm:col-span-2 flex justify-end">
              <button
                type="submit" disabled={creating}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold transition-all"
                style={{
                  backgroundColor: creating ? 'var(--lc-surface-3)' : 'var(--lc-orange)',
                  color: creating ? 'var(--lc-muted)' : '#1a1a1a',
                  cursor: creating ? 'not-allowed' : 'pointer',
                }}
              >
                {creating && <div className="w-3 h-3 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--lc-muted)', borderTopColor: '#1a1a1a' }} />}
                {creating ? 'Creating…' : 'Create & Invite'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Session list */}
      <div>
        {isInterviewer && (
          <div className="flex items-center gap-1.5 mb-4">
            {FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className="px-3 py-1 rounded-full text-xs font-medium border transition-all"
                style={{
                  backgroundColor: filter === f ? 'var(--lc-orange-dim)' : 'transparent',
                  borderColor: filter === f ? 'var(--lc-orange)' : 'var(--lc-border)',
                  color: filter === f ? 'var(--lc-orange)' : 'var(--lc-text-3)',
                }}>
                {FILTER_LABELS[f]}
                {f !== 'All' && (
                  <span className="ml-1 opacity-60">{sessions.filter(s => s.status === f).length}</span>
                )}
              </button>
            ))}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm mb-4"
            style={{ backgroundColor: 'var(--lc-error-dim)', border: '1px solid rgba(255,55,95,0.3)', color: 'var(--lc-error)' }}>
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl border p-4 flex items-center gap-4"
                style={{ backgroundColor: 'var(--lc-surface)', borderColor: 'var(--lc-border)' }}>
                <div className="w-2.5 h-2.5 rounded-full animate-pulse shrink-0" style={{ backgroundColor: 'var(--lc-surface-3)' }} />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 rounded animate-pulse" style={{ backgroundColor: 'var(--lc-surface-3)', width: `${[58, 44, 52][i]}%` }} />
                  <div className="h-3 rounded animate-pulse" style={{ backgroundColor: 'var(--lc-surface-3)', width: '30%' }} />
                </div>
                <div className="w-20 h-8 rounded-lg animate-pulse shrink-0" style={{ backgroundColor: 'var(--lc-surface-3)' }} />
              </div>
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-xl border p-12 flex flex-col items-center gap-4"
            style={{ backgroundColor: 'var(--lc-surface)', borderColor: 'var(--lc-border)' }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: 'var(--lc-surface-3)', border: '1px solid var(--lc-border)' }}>
              <svg className="w-7 h-7" style={{ color: 'var(--lc-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium" style={{ color: 'var(--lc-text-2)' }}>
                {isInterviewer ? 'No sessions yet' : 'No interview invitation yet'}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--lc-muted)' }}>
                {isInterviewer
                  ? 'Create a session and invite a candidate to get started.'
                  : 'When an interviewer invites you, your session will appear here.'}
              </p>
            </div>
            {isInterviewer && (
              <button onClick={() => setShowForm(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium"
                style={{ backgroundColor: 'var(--lc-orange-dim)', color: 'var(--lc-orange)', border: '1px solid rgba(255,161,22,0.3)' }}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Session
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {visible.map(session => (
              <SessionCard key={session.id} session={session} navigate={navigate} isInterviewer={isInterviewer} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('problems')

  const badge = ROLE_BADGE[user?.role] || { label: user?.role, bg: 'rgba(128,128,128,0.15)', color: '#808080' }
  const initials = user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'U'

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--lc-bg)' }}>

      {/* ── Navbar ───────────────────────────────────────────────── */}
      <nav
        className="sticky top-0 z-50 flex items-center justify-between px-4 sm:px-6 h-14 border-b shrink-0"
        style={{ backgroundColor: 'var(--lc-nav)', borderColor: 'var(--lc-border)' }}
      >
        {/* Left: Logo + nav tabs */}
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-2 mr-4">
            <LCLogo size={26} />
            <span className="font-semibold text-sm hidden sm:block" style={{ color: 'var(--lc-text)' }}>
              Interview<span style={{ color: 'var(--lc-orange)' }}>AI</span>
            </span>
          </div>

          {NAV_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative flex items-center gap-1.5 px-3 h-14 text-sm font-medium transition-colors"
              style={{ color: activeTab === tab.id ? 'var(--lc-text)' : 'var(--lc-text-3)' }}
              onMouseEnter={e => { if (activeTab !== tab.id) e.currentTarget.style.color = 'var(--lc-text-2)' }}
              onMouseLeave={e => { if (activeTab !== tab.id) e.currentTarget.style.color = 'var(--lc-text-3)' }}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.badge && (
                <span className="relative flex w-1.5 h-1.5 ml-0.5">
                  <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping" style={{ backgroundColor: '#00b8a3' }} />
                  <span className="relative w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#00b8a3' }} />
                </span>
              )}
              {activeTab === tab.id && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ backgroundColor: 'var(--lc-orange)' }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Right: User info + logout */}
        <div className="flex items-center gap-3">
          <span
            className="hidden sm:inline-flex lc-badge text-xs"
            style={{ backgroundColor: badge.bg, color: badge.color }}
          >
            {badge.label}
          </span>
          <span className="hidden md:block text-xs" style={{ color: 'var(--lc-text-2)' }}>
            {user?.name}
          </span>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold select-none"
            style={{ backgroundColor: 'var(--lc-orange-dim)', color: 'var(--lc-orange)', border: '1px solid rgba(255,161,22,0.3)' }}
          >
            {initials}
          </div>
          <button
            onClick={logout}
            className="lc-btn-ghost text-xs"
            style={{ color: 'var(--lc-text-3)' }}
            title="Sign out"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </nav>

      {/* ── Content ──────────────────────────────────────────────── */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'problems'     && <ProblemsPanel />}
        {activeTab === 'live'         && <LiveRoomsPanel navigate={navigate} userRole={user?.role} />}
        {activeTab === 'ai'           && <AIInterview />}
        {activeTab === 'performance'  && <PerformanceChart />}
      </main>
    </div>
  )
}
