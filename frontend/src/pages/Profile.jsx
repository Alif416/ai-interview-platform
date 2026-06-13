import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

function LCLogo({ size = 26 }) {
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

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--lc-text-3)' }}>
        {label}
      </span>
      <div
        className="px-4 py-2.5 rounded-lg text-sm font-medium"
        style={{
          backgroundColor: 'var(--lc-surface-2)',
          color: 'var(--lc-text)',
          border: '1px solid var(--lc-border)',
        }}
      >
        {value}
      </div>
    </div>
  )
}

function Alert({ type, message }) {
  if (!message) return null
  const isError = type === 'error'
  return (
    <div
      className="px-4 py-3 rounded-lg text-sm"
      style={{
        backgroundColor: isError ? 'var(--lc-error-dim)' : 'rgba(0,184,163,0.1)',
        color: isError ? 'var(--lc-error)' : 'var(--lc-easy)',
        border: `1px solid ${isError ? 'rgba(255,55,95,0.3)' : 'rgba(0,184,163,0.3)'}`,
      }}
    >
      {message}
    </div>
  )
}

function ChangePasswordSection() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (form.newPassword !== form.confirmPassword) {
      return setError('New passwords do not match')
    }
    if (form.newPassword.length < 6) {
      return setError('New password must be at least 6 characters')
    }

    setLoading(true)
    try {
      const { data } = await api.put('/auth/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      })
      setSuccess(data.message || 'Password changed successfully')
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="rounded-xl p-6"
      style={{ backgroundColor: 'var(--lc-surface)', border: '1px solid var(--lc-border)' }}
    >
      <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--lc-text)' }}>
        Change Password
      </h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Alert type="error" message={error} />
        <Alert type="success" message={success} />

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--lc-text-3)' }}>
            Current Password
          </label>
          <input
            type="password"
            name="currentPassword"
            value={form.currentPassword}
            onChange={handleChange}
            required
            placeholder="Enter current password"
            className="lc-input"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--lc-text-3)' }}>
            New Password
          </label>
          <input
            type="password"
            name="newPassword"
            value={form.newPassword}
            onChange={handleChange}
            required
            placeholder="Enter new password (min. 6 characters)"
            className="lc-input"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--lc-text-3)' }}>
            Confirm New Password
          </label>
          <input
            type="password"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            required
            placeholder="Repeat new password"
            className="lc-input"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="lc-btn-primary self-start"
        >
          {loading ? 'Updating…' : 'Update Password'}
        </button>
      </form>
    </div>
  )
}

function DeleteAccountSection({ onDeleted }) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleDelete = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.delete('/auth/delete-account', { data: { password } })
      onDeleted()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete account')
      setLoading(false)
    }
  }

  return (
    <div
      className="rounded-xl p-6"
      style={{
        backgroundColor: 'var(--lc-surface)',
        border: '1px solid rgba(255,55,95,0.3)',
      }}
    >
      <h2 className="text-base font-semibold mb-1" style={{ color: '#ff375f' }}>
        Delete Account
      </h2>
      <p className="text-sm mb-4" style={{ color: 'var(--lc-text-3)' }}>
        Permanently delete your account and all associated data. This action cannot be undone.
      </p>

      {!showConfirm ? (
        <button
          onClick={() => setShowConfirm(true)}
          className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
          style={{
            backgroundColor: 'rgba(255,55,95,0.12)',
            color: '#ff375f',
            border: '1px solid rgba(255,55,95,0.3)',
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,55,95,0.2)'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255,55,95,0.12)'}
        >
          Delete My Account
        </button>
      ) : (
        <form onSubmit={handleDelete} className="flex flex-col gap-4">
          <Alert type="error" message={error} />
          <p className="text-sm font-medium" style={{ color: 'var(--lc-text-2)' }}>
            Enter your password to confirm deletion:
          </p>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            placeholder="Your password"
            className="lc-input"
          />
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{
                backgroundColor: loading ? 'rgba(255,55,95,0.1)' : 'rgba(255,55,95,0.15)',
                color: '#ff375f',
                border: '1px solid rgba(255,55,95,0.35)',
              }}
            >
              {loading ? 'Deleting…' : 'Confirm Delete'}
            </button>
            <button
              type="button"
              onClick={() => { setShowConfirm(false); setPassword(''); setError('') }}
              className="lc-btn-ghost text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default function Profile() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const badge = ROLE_BADGE[user?.role] || { label: user?.role, bg: 'rgba(128,128,128,0.15)', color: '#808080' }
  const initials = user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'U'

  const handleDeleted = async () => {
    await logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--lc-bg)' }}>

      {/* Navbar */}
      <nav
        className="sticky top-0 z-50 flex items-center justify-between px-4 sm:px-6 h-14 border-b shrink-0"
        style={{ backgroundColor: 'var(--lc-nav)', borderColor: 'var(--lc-border)' }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2"
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <LCLogo size={26} />
            <span className="font-semibold text-sm hidden sm:block" style={{ color: 'var(--lc-text)' }}>
              LevelUp<span style={{ color: 'var(--lc-orange)' }}>.io</span>
            </span>
          </button>
          <span className="text-sm" style={{ color: 'var(--lc-text-3)' }}>/</span>
          <span className="text-sm font-medium" style={{ color: 'var(--lc-text-2)' }}>Profile</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="lc-btn-ghost text-xs"
            style={{ color: 'var(--lc-text-3)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="hidden sm:inline">Dashboard</span>
          </button>
          <button
            onClick={logout}
            className="lc-btn-ghost text-xs"
            style={{ color: 'var(--lc-text-3)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">

        {/* Header: Avatar + name */}
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold select-none shrink-0"
            style={{
              backgroundColor: 'var(--lc-orange-dim)',
              color: 'var(--lc-orange)',
              border: '2px solid rgba(255,161,22,0.4)',
            }}
          >
            {initials}
          </div>
          <div>
            <h1 className="text-xl font-semibold" style={{ color: 'var(--lc-text)' }}>
              {user?.name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm" style={{ color: 'var(--lc-text-3)' }}>@{user?.username}</span>
              <span
                className="lc-badge text-xs"
                style={{ backgroundColor: badge.bg, color: badge.color }}
              >
                {badge.label}
              </span>
            </div>
          </div>
        </div>

        {/* Account Info */}
        <div
          className="rounded-xl p-6"
          style={{ backgroundColor: 'var(--lc-surface)', border: '1px solid var(--lc-border)' }}
        >
          <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--lc-text)' }}>
            Account Information
          </h2>
          <div className="flex flex-col gap-4">
            <InfoRow label="Full Name" value={user?.name} />
            <InfoRow label="Username" value={`@${user?.username}`} />
            <InfoRow label="Email" value={user?.email} />
            <InfoRow label="Role" value={badge.label} />
          </div>
        </div>

        {/* Change Password */}
        <ChangePasswordSection />

        {/* Delete Account */}
        <DeleteAccountSection onDeleted={handleDeleted} />

      </main>
    </div>
  )
}
