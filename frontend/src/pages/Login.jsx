import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/* LeetCode-style SVG logo mark */
function LCLogo({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 95 111" fill="none">
      <path d="M68.0,84.0 L35.0,84.0 C26.7,84.0 20.0,77.3 20.0,69.0 L20.0,42.0 C20.0,33.7 26.7,27.0 35.0,27.0 L68.0,27.0" stroke="#ffa116" strokeWidth="9" strokeLinecap="round"/>
      <path d="M48.0,13.0 L48.0,98.0" stroke="#b3b3b3" strokeWidth="9" strokeLinecap="round"/>
      <path d="M28.0,55.5 L68.0,55.5" stroke="#b3b3b3" strokeWidth="9" strokeLinecap="round"/>
    </svg>
  )
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--lc-bg)' }}
    >
      {/* Minimal top bar */}
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

      {/* Body */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div
          className="w-full max-w-sm rounded-2xl border"
          style={{ backgroundColor: 'var(--lc-surface)', borderColor: 'var(--lc-border)' }}
        >
          {/* Card header */}
          <div
            className="px-8 pt-8 pb-6 border-b"
            style={{ borderColor: 'var(--lc-border)' }}
          >
            <h1 className="text-lg font-semibold mb-1" style={{ color: 'var(--lc-text)' }}>
              Sign in
            </h1>
            <p className="text-xs" style={{ color: 'var(--lc-muted)' }}>
              New here?{' '}
              <Link to="/register" style={{ color: 'var(--lc-orange)' }}>
                Create an account
              </Link>
            </p>
          </div>

          {/* Form */}
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
                <label
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: 'var(--lc-text-2)' }}
                >
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="lc-input"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium" style={{ color: 'var(--lc-text-2)' }}>
                    Password
                  </label>
                  <Link to="/forgot-password" className="text-xs" style={{ color: 'var(--lc-orange)' }}>
                    Forgot password?
                  </Link>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="lc-input"
                />
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
                    Signing in...
                  </>
                ) : 'Sign In'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center pb-6">
        <p className="text-xs" style={{ color: 'var(--lc-text-3)' }}>
          © 2025 LevelUp.io · Built for engineers who want to level up
        </p>
      </footer>
    </div>
  )
}
