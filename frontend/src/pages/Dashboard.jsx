import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import SessionList from '../components/SessionList'
import AIInterview from './AIInterview'

const ROLE_COLORS = {
  ADMIN: { bg: 'rgba(239,71,67,0.15)', color: '#ef4743', label: 'Admin' },
  INTERVIEWER: { bg: 'rgba(96,165,250,0.15)', color: '#60a5fa', label: 'Interviewer' },
  CANDIDATE: { bg: 'rgba(0,184,163,0.15)', color: '#00b8a3', label: 'Candidate' },
}

function NavTab({ label, active, onClick, icon }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors relative"
      style={{ color: active ? 'var(--lc-orange)' : 'var(--lc-muted)' }}
    >
      {icon}
      {label}
      {active && (
        <span
          className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t"
          style={{ backgroundColor: 'var(--lc-orange)' }}
        />
      )}
    </button>
  )
}

function Dashboard() {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('sessions')

  const roleStyle = ROLE_COLORS[user?.role] || { bg: 'rgba(107,114,128,0.2)', color: '#6b7280', label: user?.role }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--lc-bg)' }}>
      {/* Top Navigation */}
      <nav
        className="sticky top-0 z-50 border-b"
        style={{
          backgroundColor: 'var(--lc-surface)',
          borderColor: 'var(--lc-border)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-md flex items-center justify-center text-black font-bold text-sm"
                style={{ backgroundColor: 'var(--lc-orange)' }}
              >
                AI
              </div>
              <span className="text-base font-bold hidden sm:block" style={{ color: 'var(--lc-text)' }}>
                InterviewAI
              </span>
            </div>

            {/* Center Tabs */}
            <div className="flex items-center h-14">
              <NavTab
                label="Sessions"
                active={activeTab === 'sessions'}
                onClick={() => setActiveTab('sessions')}
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                }
              />
              <NavTab
                label="AI Practice"
                active={activeTab === 'ai'}
                onClick={() => setActiveTab('ai')}
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                }
              />
            </div>

            {/* Right: User info */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: 'rgba(255,161,22,0.2)', color: 'var(--lc-orange)' }}
                >
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <span className="text-sm font-medium" style={{ color: 'var(--lc-text-dim)' }}>
                  {user?.name}
                </span>
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ backgroundColor: roleStyle.bg, color: roleStyle.color }}
                >
                  {roleStyle.label}
                </span>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all"
                style={{
                  backgroundColor: 'rgba(239,71,67,0.1)',
                  color: 'var(--lc-error)',
                  border: '1px solid rgba(239,71,67,0.2)',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239,71,67,0.2)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(239,71,67,0.1)'}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {activeTab === 'sessions' && <SessionList />}
        {activeTab === 'ai' && <AIInterview />}
      </main>
    </div>
  )
}

export default Dashboard
