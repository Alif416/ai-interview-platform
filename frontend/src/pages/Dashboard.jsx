import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import SessionList from '../components/SessionList'
import AIInterview from './AIInterview'

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

const NAV_TABS = [
  {
    id: 'sessions',
    label: 'Problems',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    ),
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
    id: 'live',
    label: 'Live Rooms',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.882V15.118a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
    badge: true,
  },
]

function LiveRoomsPanel({ navigate }) {
  const [sessionId, setSessionId] = useState('')

  return (
    <div className="max-w-lg mx-auto mt-8 flex flex-col gap-6">
      {/* Hero */}
      <div className="text-center flex flex-col items-center gap-3">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: 'var(--lc-orange-dim)', border: '1px solid rgba(255,161,22,0.3)' }}
        >
          <svg className="w-7 h-7" style={{ color: 'var(--lc-orange)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.882V15.118a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--lc-text)' }}>Live Interview Rooms</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--lc-text-3)' }}>
            Join a session room to collaborate with a shared code editor and real-time chat.
          </p>
        </div>
      </div>

      {/* Quick join */}
      <div
        className="rounded-xl border p-5 flex flex-col gap-4"
        style={{ backgroundColor: 'var(--lc-surface)', borderColor: 'var(--lc-border)' }}
      >
        <p className="text-sm font-medium" style={{ color: 'var(--lc-text-2)' }}>Enter a Session ID to join its room</p>
        <div className="flex gap-2">
          <input
            type="number"
            value={sessionId}
            onChange={e => setSessionId(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sessionId && navigate(`/room/${sessionId}`)}
            placeholder="Session ID (e.g. 3)"
            className="lc-input flex-1"
            style={{ padding: '8px 12px' }}
            min="1"
          />
          <button
            onClick={() => sessionId && navigate(`/room/${sessionId}`)}
            disabled={!sessionId}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              backgroundColor: sessionId ? 'var(--lc-orange)' : 'var(--lc-surface-3)',
              color: sessionId ? '#1a1a1a' : 'var(--lc-muted)',
              cursor: sessionId ? 'pointer' : 'not-allowed',
            }}
          >
            Join
          </button>
        </div>
      </div>

      {/* How it works */}
      <div
        className="rounded-xl border p-5 flex flex-col gap-3"
        style={{ backgroundColor: 'var(--lc-surface)', borderColor: 'var(--lc-border)' }}
      >
        <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--lc-muted)' }}>
          How it works
        </p>
        {[
          { icon: '1', text: 'Find a session in the Problems tab and click Join next to it' },
          { icon: '2', text: 'Both interviewer and candidate connect simultaneously via real-time WebSocket' },
          { icon: '3', text: 'Collaborate on a shared code editor with live chat' },
        ].map(item => (
          <div key={item.icon} className="flex items-start gap-3">
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
              style={{ backgroundColor: 'var(--lc-orange-dim)', color: 'var(--lc-orange)' }}
            >
              {item.icon}
            </span>
            <p className="text-sm" style={{ color: 'var(--lc-text-3)' }}>{item.text}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-center" style={{ color: 'var(--lc-muted)' }}>
        Or click the <strong style={{ color: 'var(--lc-orange)' }}>Join</strong> button on any session in the Problems tab.
      </p>
    </div>
  )
}

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('sessions')

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
          {/* Logo */}
          <div className="flex items-center gap-2 mr-4">
            <LCLogo size={26} />
            <span className="font-semibold text-sm hidden sm:block" style={{ color: 'var(--lc-text)' }}>
              Interview<span style={{ color: 'var(--lc-orange)' }}>AI</span>
            </span>
          </div>

          {/* Tabs */}
          {NAV_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative flex items-center gap-1.5 px-3 h-14 text-sm font-medium transition-colors"
              style={{
                color: activeTab === tab.id ? 'var(--lc-text)' : 'var(--lc-text-3)',
              }}
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
          {/* Role badge */}
          <span
            className="hidden sm:inline-flex lc-badge text-xs"
            style={{ backgroundColor: badge.bg, color: badge.color }}
          >
            {badge.label}
          </span>

          {/* User name */}
          <span className="hidden md:block text-xs" style={{ color: 'var(--lc-text-2)' }}>
            {user?.name}
          </span>

          {/* Avatar */}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold select-none"
            style={{ backgroundColor: 'var(--lc-orange-dim)', color: 'var(--lc-orange)', border: '1px solid rgba(255,161,22,0.3)' }}
          >
            {initials}
          </div>

          {/* Logout */}
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
        {activeTab === 'sessions' && <SessionList />}
        {activeTab === 'ai'       && <AIInterview />}
        {activeTab === 'live'     && <LiveRoomsPanel navigate={navigate} />}
      </main>
    </div>
  )
}
