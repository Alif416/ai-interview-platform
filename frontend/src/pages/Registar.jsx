import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function LCLogo({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 95 111" fill="none">
      <path d="M68.0,84.0 L35.0,84.0 C26.7,84.0 20.0,77.3 20.0,69.0 L20.0,42.0 C20.0,33.7 26.7,27.0 35.0,27.0 L68.0,27.0" stroke="#ffa116" strokeWidth="9" strokeLinecap="round"/>
      <path d="M48.0,13.0 L48.0,98.0" stroke="#b3b3b3" strokeWidth="9" strokeLinecap="round"/>
      <path d="M28.0,55.5 L68.0,55.5" stroke="#b3b3b3" strokeWidth="9" strokeLinecap="round"/>
    </svg>
  )
}

const ROLES = [
  {
    value: 'CANDIDATE',
    label: 'Candidate',
    desc: 'Preparing for interviews',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    value: 'INTERVIEWER',
    label: 'Interviewer',
    desc: 'Conducting interviews',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
]

export default function Register() {
  const [formData, setFormData] = useState({ name: '', username: '', email: '', password: '', role: 'CANDIDATE' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState(null)
  const { register } = useAuth()

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(formData.name, formData.username, formData.email, formData.password, formData.role)
      setRegisteredEmail(formData.email)
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (registeredEmail) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--lc-bg)' }}>
        <header
          className="flex items-center px-6 h-14 border-b shrink-0"
          style={{ backgroundColor: 'var(--lc-nav)', borderColor: 'var(--lc-border)' }}
        >
          <div className="flex items-center gap-2.5">
            <LCLogo size={28} />
            <span className="font-semibold text-base" style={{ color: 'var(--lc-text)' }}>
              LevelUp<span style={{ color: 'var(--lc-orange)' }}>.io</span>
            </span>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center px-4">
          <div
            className="w-full max-w-sm rounded-2xl border p-8 text-center"
            style={{ backgroundColor: 'var(--lc-surface)', borderColor: 'var(--lc-border)' }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: 'rgba(255,161,22,0.15)' }}
            >
              <svg className="w-6 h-6" fill="none" stroke="var(--lc-orange)" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--lc-text)' }}>Check your email</h2>
            <p className="text-sm mb-1" style={{ color: 'var(--lc-muted)' }}>
              We sent a verification link to
            </p>
            <p className="text-sm font-medium mb-6" style={{ color: 'var(--lc-text)' }}>{registeredEmail}</p>
            <p className="text-xs mb-6" style={{ color: 'var(--lc-muted)' }}>
              Click the link in the email to activate your account. The link expires in 24 hours.
            </p>
            <Link to="/login" className="text-sm" style={{ color: 'var(--lc-orange)' }}>
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--lc-bg)' }}>
      {/* Top bar */}
      <header
        className="flex items-center px-6 h-14 border-b shrink-0"
        style={{ backgroundColor: 'var(--lc-nav)', borderColor: 'var(--lc-border)' }}
      >
        <Link to="/login" className="flex items-center gap-2.5">
          <LCLogo size={28} />
          <span className="font-semibold text-base" style={{ color: 'var(--lc-text)' }}>
            LevelUp<span style={{ color: 'var(--lc-orange)' }}>.io</span>
          </span>
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div
          className="w-full max-w-sm rounded-2xl border"
          style={{ backgroundColor: 'var(--lc-surface)', borderColor: 'var(--lc-border)' }}
        >
          {/* Card header */}
          <div className="px-8 pt-8 pb-6 border-b" style={{ borderColor: 'var(--lc-border)' }}>
            <h1 className="text-lg font-semibold mb-1" style={{ color: 'var(--lc-text)' }}>
              Create account
            </h1>
            <p className="text-xs" style={{ color: 'var(--lc-muted)' }}>
              Already have one?{' '}
              <Link to="/login" style={{ color: 'var(--lc-orange)' }}>Sign in</Link>
            </p>
          </div>

          <div className="px-8 py-6">
            {error && (
              <div
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg mb-5 text-xs"
                style={{
                  backgroundColor: 'var(--lc-error-dim)',
                  border: '1px solid rgba(255,55,95,0.3)',
                  color: 'var(--lc-error)',
                }}
              >
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--lc-text-2)' }}>
                  Full Name
                </label>
                <input
                  type="text" name="name" value={formData.name}
                  onChange={handleChange} placeholder="John Doe" required
                  className="lc-input"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--lc-text-2)' }}>
                  Username
                </label>
                <div className="relative">
                  <span
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium select-none"
                    style={{ color: 'var(--lc-muted)' }}
                  >@</span>
                  <input
                    type="text" name="username" value={formData.username}
                    onChange={e => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                    placeholder="john_doe" required
                    className="lc-input"
                    style={{ paddingLeft: '24px' }}
                    minLength={3} maxLength={30}
                  />
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--lc-muted)' }}>Lowercase letters, numbers, underscores only</p>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--lc-text-2)' }}>
                  Email
                </label>
                <input
                  type="email" name="email" value={formData.email}
                  onChange={handleChange} placeholder="name@example.com" required
                  className="lc-input"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--lc-text-2)' }}>
                  Password
                </label>
                <input
                  type="password" name="password" value={formData.password}
                  onChange={handleChange} placeholder="••••••••" required
                  className="lc-input"
                />
              </div>

              {/* Role toggle */}
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: 'var(--lc-text-2)' }}>
                  I am a...
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {ROLES.map(r => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, role: r.value })}
                      className="flex flex-col items-center gap-1.5 py-3.5 px-2 rounded-xl border text-xs transition-all"
                      style={{
                        backgroundColor: formData.role === r.value ? 'var(--lc-orange-dim)' : 'var(--lc-surface-2)',
                        borderColor: formData.role === r.value ? 'var(--lc-orange)' : 'var(--lc-border)',
                        color: formData.role === r.value ? 'var(--lc-orange)' : 'var(--lc-text-3)',
                      }}
                    >
                      {r.icon}
                      <span className="font-semibold">{r.label}</span>
                      <span style={{ color: 'var(--lc-muted)', fontSize: '11px' }}>{r.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="lc-btn-primary w-full justify-center mt-1"
                style={{ borderRadius: '8px', padding: '10px' }}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                      <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75" />
                    </svg>
                    Creating account...
                  </>
                ) : 'Create Account'}
              </button>
            </form>
          </div>
        </div>
      </div>

      <footer className="text-center pb-6">
        <p className="text-xs" style={{ color: 'var(--lc-text-3)' }}>
          © 2025 LevelUp.io · Built for engineers who want to level up
        </p>
      </footer>
    </div>
  )
}
