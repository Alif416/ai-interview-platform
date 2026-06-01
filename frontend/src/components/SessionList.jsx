import { useState, useEffect } from 'react'
import SessionCard from './SessionCard'

function SessionList() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true)
        const response = await fetch('http://localhost:3000/api/v1/sessions')
        const data = await response.json()
        if (data.success) {
          setSessions(data.data.sessions)
        } else {
          setError('Failed to fetch sessions')
        }
      } catch {
        setError('Cannot connect to server')
      } finally {
        setLoading(false)
      }
    }
    fetchSessions()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div
          className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--lc-border)', borderTopColor: 'var(--lc-orange)' }}
        />
        <p className="text-sm" style={{ color: 'var(--lc-muted)' }}>Loading sessions...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div
        className="flex items-center gap-3 px-5 py-4 rounded-xl text-sm"
        style={{
          backgroundColor: 'var(--lc-error-dim)',
          border: '1px solid rgba(239,71,67,0.3)',
          color: 'var(--lc-error)',
        }}
      >
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div>
          <p className="font-medium">Connection error</p>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(239,71,67,0.7)' }}>{error}</p>
        </div>
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center h-64 rounded-xl border text-center px-8"
        style={{ backgroundColor: 'var(--lc-surface)', borderColor: 'var(--lc-border)' }}
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
          style={{ backgroundColor: 'rgba(255,161,22,0.1)' }}
        >
          <svg className="w-6 h-6" style={{ color: 'var(--lc-orange)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <p className="font-semibold mb-1" style={{ color: 'var(--lc-text)' }}>No sessions yet</p>
        <p className="text-sm" style={{ color: 'var(--lc-muted)' }}>
          Create your first interview session to get started
        </p>
      </div>
    )
  }

  const statusCounts = sessions.reduce((acc, s) => {
    acc[s.status] = (acc[s.status] || 0) + 1
    return acc
  }, {})

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--lc-text)' }}>
            Interview Sessions
          </h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--lc-muted)' }}>
            {sessions.length} session{sessions.length !== 1 ? 's' : ''} total
          </p>
        </div>

        {/* Status summary pills */}
        <div className="hidden sm:flex items-center gap-2">
          {Object.entries(statusCounts).map(([status, count]) => {
            const colors = {
              SCHEDULED: { bg: 'rgba(96,165,250,0.1)', color: '#60a5fa' },
              IN_PROGRESS: { bg: 'rgba(255,192,30,0.1)', color: '#ffc01e' },
              COMPLETED: { bg: 'rgba(0,184,163,0.1)', color: '#00b8a3' },
              CANCELLED: { bg: 'rgba(239,71,67,0.1)', color: '#ef4743' },
            }
            const c = colors[status] || { bg: 'rgba(107,114,128,0.1)', color: '#6b7280' }
            return (
              <span
                key={status}
                className="px-2.5 py-1 rounded-full text-xs font-medium"
                style={{ backgroundColor: c.bg, color: c.color }}
              >
                {count} {status.charAt(0) + status.slice(1).toLowerCase().replace('_', ' ')}
              </span>
            )
          })}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {sessions.map(session => (
          <SessionCard
            key={session.id}
            title={session.title}
            role={session.role}
            level={session.level}
            status={session.status}
            candidateName={session.candidate.name}
          />
        ))}
      </div>
    </div>
  )
}

export default SessionList
