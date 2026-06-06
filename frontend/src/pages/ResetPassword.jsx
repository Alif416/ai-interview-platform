import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'

function LCLogo({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 95 111" fill="none">
      <path d="M68.0,84.0 L35.0,84.0 C26.7,84.0 20.0,77.3 20.0,69.0 L20.0,42.0 C20.0,33.7 26.7,27.0 35.0,27.0 L68.0,27.0" stroke="#ffa116" strokeWidth="9" strokeLinecap="round"/>
      <path d="M48.0,13.0 L48.0,98.0" stroke="#b3b3b3" strokeWidth="9" strokeLinecap="round"/>
      <path d="M28.0,55.5 L68.0,55.5" stroke="#b3b3b3" strokeWidth="9" strokeLinecap="round"/>
    </svg>
  )
}

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--lc-bg)' }}>
        <div
          className="w-full max-w-sm rounded-2xl border p-8 text-center"
          style={{ backgroundColor: 'var(--lc-surface)', borderColor: 'var(--lc-border)' }}
        >
          <p className="text-sm mb-4" style={{ color: 'var(--lc-muted)' }}>
            Invalid reset link. Please request a new one.
          </p>
          <Link to="/forgot-password" style={{ color: 'var(--lc-orange)', fontSize: '14px' }}>
            Request new link
          </Link>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      await api.post('/auth/reset-password', { token, password })
      setSuccess(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--lc-bg)' }}>
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
          {success ? (
            <div className="p-8 text-center">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: 'rgba(34,197,94,0.15)' }}
              >
                <svg className="w-6 h-6" fill="none" stroke="#22c55e" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--lc-text)' }}>Password reset!</h2>
              <p className="text-sm mb-6" style={{ color: 'var(--lc-muted)' }}>
                Your password has been updated. Redirecting to login...
              </p>
              <Link to="/login" style={{ color: 'var(--lc-orange)', fontSize: '14px' }}>
                Go to Login
              </Link>
            </div>
          ) : (
            <>
              <div className="px-8 pt-8 pb-6 border-b" style={{ borderColor: 'var(--lc-border)' }}>
                <h1 className="text-lg font-semibold mb-1" style={{ color: 'var(--lc-text)' }}>
                  Set new password
                </h1>
                <p className="text-xs" style={{ color: 'var(--lc-muted)' }}>
                  Must be at least 6 characters.
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
                      New Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="lc-input"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--lc-text-2)' }}>
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
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
                        Resetting...
                      </>
                    ) : 'Reset Password'}
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
