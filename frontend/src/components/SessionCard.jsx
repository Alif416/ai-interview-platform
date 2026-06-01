const STATUS_CONFIG = {
  SCHEDULED: {
    label: 'Scheduled',
    bg: 'rgba(96,165,250,0.12)',
    color: '#60a5fa',
    border: 'rgba(96,165,250,0.3)',
    dot: '#60a5fa',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    bg: 'rgba(255,192,30,0.12)',
    color: '#ffc01e',
    border: 'rgba(255,192,30,0.3)',
    dot: '#ffc01e',
    pulse: true,
  },
  COMPLETED: {
    label: 'Completed',
    bg: 'rgba(0,184,163,0.12)',
    color: '#00b8a3',
    border: 'rgba(0,184,163,0.3)',
    dot: '#00b8a3',
  },
  CANCELLED: {
    label: 'Cancelled',
    bg: 'rgba(239,71,67,0.12)',
    color: '#ef4743',
    border: 'rgba(239,71,67,0.3)',
    dot: '#ef4743',
  },
}

function SessionCard({ title, role, level, status, candidateName }) {
  const s = STATUS_CONFIG[status] || {
    label: status,
    bg: 'rgba(107,114,128,0.12)',
    color: '#6b7280',
    border: 'rgba(107,114,128,0.3)',
    dot: '#6b7280',
  }

  return (
    <div
      className="rounded-xl border p-5 transition-all group cursor-pointer"
      style={{
        backgroundColor: 'var(--lc-surface)',
        borderColor: 'var(--lc-border)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--lc-border-light)'
        e.currentTarget.style.backgroundColor = 'var(--lc-surface2)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--lc-border)'
        e.currentTarget.style.backgroundColor = 'var(--lc-surface)'
      }}
    >
      {/* Card header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <h3
          className="text-sm font-semibold leading-snug line-clamp-2"
          style={{ color: 'var(--lc-text)' }}
        >
          {title}
        </h3>
        <span
          className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap"
          style={{
            backgroundColor: s.bg,
            color: s.color,
            border: `1px solid ${s.border}`,
          }}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${s.pulse ? 'animate-pulse' : ''}`}
            style={{ backgroundColor: s.dot }}
          />
          {s.label}
        </span>
      </div>

      {/* Details */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-2">
          <svg className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--lc-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span className="text-xs" style={{ color: 'var(--lc-text-dim)' }}>{role}</span>
          <span
            className="px-1.5 py-0.5 rounded text-xs font-mono"
            style={{ backgroundColor: 'var(--lc-bg)', color: 'var(--lc-orange)', border: '1px solid var(--lc-border)' }}
          >
            {level}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <svg className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--lc-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-xs" style={{ color: 'var(--lc-text-dim)' }}>{candidateName}</span>
        </div>
      </div>

      {/* Footer accent line */}
      <div
        className="mt-4 pt-3 flex items-center justify-between"
        style={{ borderTop: '1px solid var(--lc-border)' }}
      >
        <span className="text-xs" style={{ color: 'var(--lc-muted)' }}>Interview Session</span>
        <svg
          className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
          style={{ color: 'var(--lc-muted)' }}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  )
}

export default SessionCard
