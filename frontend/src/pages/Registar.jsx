import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'CANDIDATE'
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { register } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(formData.name, formData.email, formData.password, formData.role)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    backgroundColor: 'var(--lc-bg)',
    border: '1px solid var(--lc-border)',
    color: 'var(--lc-text)',
  }

  const roles = [
    {
      value: 'CANDIDATE',
      label: 'Candidate',
      desc: 'Preparing for interviews',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
    {
      value: 'INTERVIEWER',
      label: 'Interviewer',
      desc: 'Conducting interviews',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ]

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ backgroundColor: 'var(--lc-bg)' }}
    >
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(var(--lc-border) 1px, transparent 1px), linear-gradient(90deg, var(--lc-border) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-black font-bold text-lg"
              style={{ backgroundColor: 'var(--lc-orange)' }}
            >
              AI
            </div>
            <span className="text-2xl font-bold" style={{ color: 'var(--lc-text)' }}>
              InterviewAI
            </span>
          </div>
          <p className="text-sm" style={{ color: 'var(--lc-muted)' }}>
            Join thousands of engineers leveling up
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl border p-8"
          style={{ backgroundColor: 'var(--lc-surface)', borderColor: 'var(--lc-border)' }}
        >
          <h2 className="text-xl font-semibold mb-6" style={{ color: 'var(--lc-text)' }}>
            Create your account
          </h2>

          {error && (
            <div
              className="flex items-center gap-2 px-4 py-3 rounded-lg mb-5 text-sm"
              style={{
                backgroundColor: 'var(--lc-error-dim)',
                border: '1px solid var(--lc-error)',
                color: 'var(--lc-error)',
              }}
            >
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--lc-text-dim)' }}>
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                required
                className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none transition-all"
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = 'var(--lc-orange)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--lc-border)'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--lc-text-dim)' }}>
                Email address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none transition-all"
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = 'var(--lc-orange)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--lc-border)'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--lc-text-dim)' }}>
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none transition-all"
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = 'var(--lc-orange)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--lc-border)'}
              />
            </div>

            {/* Role selector */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--lc-text-dim)' }}>
                I am a...
              </label>
              <div className="grid grid-cols-2 gap-3">
                {roles.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, role: r.value })}
                    className="flex flex-col items-center gap-2 p-3.5 rounded-lg border text-sm transition-all"
                    style={{
                      backgroundColor: formData.role === r.value ? 'rgba(255,161,22,0.12)' : 'var(--lc-bg)',
                      borderColor: formData.role === r.value ? 'var(--lc-orange)' : 'var(--lc-border)',
                      color: formData.role === r.value ? 'var(--lc-orange)' : 'var(--lc-text-dim)',
                    }}
                  >
                    {r.icon}
                    <span className="font-medium">{r.label}</span>
                    <span className="text-xs" style={{ color: 'var(--lc-muted)' }}>{r.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all mt-1"
              style={{
                backgroundColor: loading ? 'var(--lc-orange-dark)' : 'var(--lc-orange)',
                color: '#000',
                opacity: loading ? 0.8 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={(e) => { if (!loading) e.target.style.backgroundColor = 'var(--lc-orange-dark)' }}
              onMouseLeave={(e) => { if (!loading) e.target.style.backgroundColor = 'var(--lc-orange)' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating account...
                </span>
              ) : 'Create Account'}
            </button>
          </form>

          <div
            className="mt-6 pt-6 text-center text-sm"
            style={{ borderTop: '1px solid var(--lc-border)', color: 'var(--lc-muted)' }}
          >
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium"
              style={{ color: 'var(--lc-orange)' }}
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register
