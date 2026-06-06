import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
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

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('verifying') // 'verifying' | 'success' | 'error'
  const [message, setMessage] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')

    if (!token) {
      setStatus('error')
      setMessage('No verification token found. Please check your email link.')
      return
    }

    api.get(`/auth/verify-email?token=${token}`)
      .then(({ data }) => {
        setStatus('success')
        setMessage(data.message)
      })
      .catch((err) => {
        setStatus('error')
        setMessage(err.response?.data?.message || 'Verification failed. The link may have expired.')
      })
  }, [searchParams])

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--lc-bg)' }}>
      <header
        className="flex items-center px-6 h-14 border-b shrink-0"
        style={{ backgroundColor: 'var(--lc-nav)', borderColor: 'var(--lc-border)' }}
      >
        <Link to="/" className="flex items-center gap-2.5">
          <LCLogo size={28} />
          <span className="font-semibold text-base" style={{ color: 'var(--lc-text)' }}>
            LevelUp<span style={{ color: 'var(--lc-orange)' }}>.io</span>
          </span>
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center px-4">
        <div
          className="w-full max-w-sm rounded-2xl border p-8 text-center"
          style={{ backgroundColor: 'var(--lc-surface)', borderColor: 'var(--lc-border)' }}
        >
          {status === 'verifying' && (
            <>
              <svg className="animate-spin w-10 h-10 mx-auto mb-4" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--lc-orange)' }}>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75" />
              </svg>
              <p style={{ color: 'var(--lc-muted)' }}>Verifying your email...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: 'rgba(34,197,94,0.15)' }}
              >
                <svg className="w-6 h-6" fill="none" stroke="#22c55e" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--lc-text)' }}>Email verified!</h2>
              <p className="text-sm mb-6" style={{ color: 'var(--lc-muted)' }}>{message}</p>
              <Link
                to="/login"
                className="lc-btn-primary w-full justify-center"
                style={{ borderRadius: '8px', padding: '10px', display: 'block' }}
              >
                Go to Login
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: 'var(--lc-error-dim)' }}
              >
                <svg className="w-6 h-6" fill="none" stroke="var(--lc-error)" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--lc-text)' }}>Verification failed</h2>
              <p className="text-sm mb-6" style={{ color: 'var(--lc-muted)' }}>{message}</p>
              <Link
                to="/login"
                className="text-sm"
                style={{ color: 'var(--lc-orange)' }}
              >
                Back to Login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
