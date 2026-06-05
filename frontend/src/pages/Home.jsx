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

const FEATURES = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    color: '#ffa116',
    bg: 'rgba(255,161,22,0.1)',
    title: 'AI-Powered Interviews',
    desc: 'Practice with an intelligent AI interviewer that evaluates your answers in real time, giving you detailed feedback on clarity, depth, and technical accuracy.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 10l4.553-2.069A1 1 0 0121 8.882V15.118a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
    color: '#00b8a3',
    bg: 'rgba(0,184,163,0.1)',
    title: 'Live Interview Rooms',
    desc: 'Interviewers invite candidates directly by username. Collaborate in real time with a shared Monaco editor, live chat, and instant code execution.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    color: '#60a5fa',
    bg: 'rgba(96,165,250,0.1)',
    title: '250+ Curated Problems',
    desc: 'Work through a hand-picked set of problems across arrays, trees, graphs, DP and more — tagged by topic and difficulty, pulled straight from the NeetCode 250.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.1)',
    title: 'Performance Analytics',
    desc: 'Track your scores, grades, and improvement across every AI session. See your strengths and weakest topics at a glance with visual performance charts.',
  },
]

const STEPS = [
  {
    n: '01',
    title: 'Create your account',
    desc: 'Sign up as a Candidate to practice, or as an Interviewer to run live sessions. Takes under a minute.',
  },
  {
    n: '02',
    title: 'Practice or get invited',
    desc: 'Candidates tackle AI mock interviews and curated problems. Interviewers invite candidates directly to a private live room.',
  },
  {
    n: '03',
    title: 'Review and improve',
    desc: 'Get instant AI feedback after every session. Track your progress over time and target the areas that need work.',
  },
]

const STATS = [
  { value: '250+', label: 'Curated Problems' },
  { value: '8',    label: 'Languages Supported' },
  { value: 'AI',   label: 'Powered Feedback' },
  { value: '∞',    label: 'Practice Sessions' },
]

const CODE_LINES = [
  { indent: 0, tokens: [{ t: 'keyword', v: 'function ' }, { t: 'fn', v: 'twoSum' }, { t: 'plain', v: '(nums, target) {' }] },
  { indent: 1, tokens: [{ t: 'keyword', v: 'const ' }, { t: 'plain', v: 'map = ' }, { t: 'keyword', v: 'new ' }, { t: 'fn', v: 'Map' }, { t: 'plain', v: '()' }] },
  { indent: 1, tokens: [{ t: 'keyword', v: 'for ' }, { t: 'plain', v: '(' }, { t: 'keyword', v: 'let ' }, { t: 'plain', v: 'i = ' }, { t: 'num', v: '0' }, { t: 'plain', v: '; i < nums.length; i++) {' }] },
  { indent: 2, tokens: [{ t: 'keyword', v: 'const ' }, { t: 'plain', v: 'complement = target - nums[i]' }] },
  { indent: 2, tokens: [{ t: 'keyword', v: 'if ' }, { t: 'plain', v: '(map.' }, { t: 'fn', v: 'has' }, { t: 'plain', v: '(complement))' }] },
  { indent: 3, tokens: [{ t: 'keyword', v: 'return ' }, { t: 'plain', v: '[map.' }, { t: 'fn', v: 'get' }, { t: 'plain', v: '(complement), i]' }] },
  { indent: 2, tokens: [{ t: 'plain', v: 'map.' }, { t: 'fn', v: 'set' }, { t: 'plain', v: '(nums[i], i)' }] },
  { indent: 1, tokens: [{ t: 'plain', v: '}' }] },
  { indent: 0, tokens: [{ t: 'plain', v: '}' }] },
]

const TOKEN_COLORS = {
  keyword: '#c084fc',
  fn: '#60a5fa',
  num: '#fca5a5',
  str: '#86efac',
  plain: '#eff2f6',
}

function CodeMockup() {
  return (
    <div
      className="rounded-2xl border overflow-hidden shadow-2xl"
      style={{ backgroundColor: '#1a1a1a', borderColor: '#3c3c3c', fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}
    >
      {/* Window chrome */}
      <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ backgroundColor: '#282828', borderColor: '#3c3c3c' }}>
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ff5f57' }} />
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#febc2e' }} />
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#28c840' }} />
        <span className="ml-3 text-xs" style={{ color: '#808080' }}>solution.js</span>
        <span className="ml-auto flex items-center gap-1.5 text-xs" style={{ color: '#00b8a3' }}>
          <span className="relative flex w-1.5 h-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping" style={{ backgroundColor: '#00b8a3' }} />
            <span className="relative w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#00b8a3' }} />
          </span>
          Live
        </span>
      </div>

      {/* Code */}
      <div className="px-4 py-4 text-sm leading-7" style={{ minHeight: '240px' }}>
        {CODE_LINES.map((line, i) => (
          <div key={i} className="flex">
            <span className="w-8 shrink-0 text-xs select-none" style={{ color: '#4a4a4a', paddingTop: '2px' }}>{i + 1}</span>
            <span style={{ paddingLeft: `${line.indent * 16}px` }}>
              {line.tokens.map((tok, j) => (
                <span key={j} style={{ color: TOKEN_COLORS[tok.t] }}>{tok.v}</span>
              ))}
            </span>
          </div>
        ))}
      </div>

      {/* Test result bar */}
      <div className="px-4 py-3 border-t flex items-center justify-between" style={{ backgroundColor: '#1f1f1f', borderColor: '#3c3c3c' }}>
        <div className="flex items-center gap-2 text-xs" style={{ color: '#00b8a3' }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          All test cases passed
        </div>
        <span className="text-xs" style={{ color: '#808080' }}>Runtime: 68ms · Memory: 42.1MB</span>
      </div>
    </div>
  )
}

export default function Home() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--lc-bg)', color: 'var(--lc-text)' }}>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes gradientShift {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .hero-title {
          animation: fadeUp 0.7s ease both;
        }
        .hero-sub {
          animation: fadeUp 0.7s ease 0.15s both;
        }
        .hero-cta {
          animation: fadeUp 0.7s ease 0.28s both;
        }
        .hero-code {
          animation: fadeUp 0.7s ease 0.1s both, float 5s ease-in-out 1s infinite;
        }
        .gradient-text {
          background: linear-gradient(135deg, #ffa116 0%, #ff375f 50%, #a78bfa 100%);
          background-size: 200% 200%;
          animation: gradientShift 4s ease infinite;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .feature-card:hover {
          transform: translateY(-3px);
          border-color: rgba(255,161,22,0.25) !important;
        }
        .feature-card { transition: transform 0.2s ease, border-color 0.2s ease; }
        .glow-orange {
          box-shadow: 0 0 60px rgba(255,161,22,0.08), 0 0 120px rgba(255,161,22,0.04);
        }
      `}</style>

      {/* ── Navbar ─────────────────────────────────────────────────── */}
      <nav
        className="sticky top-0 z-50 flex items-center justify-between px-6 sm:px-10 h-16 border-b"
        style={{ backgroundColor: 'rgba(26,26,26,0.85)', borderColor: 'var(--lc-border)', backdropFilter: 'blur(12px)' }}
      >
        <div className="flex items-center gap-2.5">
          <LCLogo size={28} />
          <span className="font-bold text-base tracking-tight" style={{ color: 'var(--lc-text)' }}>
            LevelUp<span style={{ color: 'var(--lc-orange)' }}>.io</span>
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {['Features', 'How it works'].map(item => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(/ /g, '-')}`}
              className="text-sm transition-colors"
              style={{ color: 'var(--lc-text-3)' }}
              onMouseEnter={e => e.target.style.color = 'var(--lc-text)'}
              onMouseLeave={e => e.target.style.color = 'var(--lc-text-3)'}
            >
              {item}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="lc-btn-secondary text-sm"
            style={{ padding: '6px 18px' }}
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="lc-btn-primary text-sm"
            style={{ padding: '7px 18px' }}
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="relative flex-1 flex items-center overflow-hidden" style={{ minHeight: '88vh' }}>

        {/* Background grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(rgba(60,60,60,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(60,60,60,0.25) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            maskImage: 'radial-gradient(ellipse 80% 60% at 50% 50%, black 30%, transparent 100%)',
          }}
        />

        {/* Orange glow */}
        <div
          className="absolute pointer-events-none"
          style={{
            width: '600px', height: '600px',
            background: 'radial-gradient(circle, rgba(255,161,22,0.07) 0%, transparent 70%)',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />

        <div className="relative w-full max-w-7xl mx-auto px-6 sm:px-10 py-24 grid lg:grid-cols-2 gap-16 items-center">

          {/* Left: text */}
          <div className="flex flex-col gap-7">
            <div
              className="hero-title inline-flex items-center gap-2 self-start px-3 py-1.5 rounded-full border text-xs font-medium"
              style={{ backgroundColor: 'rgba(255,161,22,0.08)', borderColor: 'rgba(255,161,22,0.25)', color: 'var(--lc-orange)' }}
            >
              <span className="relative flex w-1.5 h-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping" style={{ backgroundColor: 'var(--lc-orange)' }} />
                <span className="relative w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--lc-orange)' }} />
              </span>
              Real-time AI coding interviews
            </div>

            <h1
              className="hero-title text-5xl sm:text-6xl font-extrabold leading-tight tracking-tight"
              style={{ color: 'var(--lc-text)', letterSpacing: '-0.02em' }}
            >
              Ace your next
              <br />
              <span className="gradient-text">technical interview</span>
            </h1>

            <p className="hero-sub text-base leading-relaxed max-w-lg" style={{ color: 'var(--lc-text-3)' }}>
              Practice with an AI interviewer, solve real coding problems, and collaborate live with interviewers — all in one platform built for engineers who want to level up.
            </p>

            <div className="hero-cta flex flex-wrap gap-3">
              <Link to="/register" className="lc-btn-primary" style={{ fontSize: '14px', padding: '10px 28px', borderRadius: '10px' }}>
                Start for free
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link to="/login" className="lc-btn-secondary" style={{ fontSize: '14px', padding: '10px 24px', borderRadius: '10px' }}>
                Sign in
              </Link>
            </div>

            {/* Stats row */}
            <div className="hero-cta flex flex-wrap gap-6 pt-2">
              {STATS.map(stat => (
                <div key={stat.label} className="flex flex-col">
                  <span className="text-2xl font-bold" style={{ color: 'var(--lc-orange)' }}>{stat.value}</span>
                  <span className="text-xs" style={{ color: 'var(--lc-text-3)' }}>{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: code mockup */}
          <div className="hero-code hidden lg:block glow-orange">
            <CodeMockup />

            {/* Floating participant badge */}
            <div
              className="absolute -bottom-4 -left-6 flex items-center gap-2.5 px-4 py-2.5 rounded-xl border shadow-xl"
              style={{ backgroundColor: '#282828', borderColor: '#3c3c3c' }}
            >
              <div className="flex -space-x-2">
                {['#ffa116', '#00b8a3', '#60a5fa'].map((c, i) => (
                  <div key={i} className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold"
                    style={{ backgroundColor: `${c}22`, color: c, borderColor: '#282828' }}>
                    {['A', 'B', 'C'][i]}
                  </div>
                ))}
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: 'var(--lc-text)' }}>2 participants</p>
                <p className="text-xs" style={{ color: 'var(--lc-muted)' }}>Live session</p>
              </div>
              <span className="relative flex w-1.5 h-1.5 ml-1">
                <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping" style={{ backgroundColor: '#00b8a3' }} />
                <span className="relative w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#00b8a3' }} />
              </span>
            </div>

            {/* Floating AI feedback badge */}
            <div
              className="absolute -top-4 -right-6 flex items-center gap-2.5 px-4 py-2.5 rounded-xl border shadow-xl"
              style={{ backgroundColor: '#282828', borderColor: '#3c3c3c' }}
            >
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'rgba(167,139,250,0.15)' }}>
                <svg className="w-4 h-4" style={{ color: '#a78bfa' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: 'var(--lc-text)' }}>AI Score: 92/100</p>
                <p className="text-xs" style={{ color: '#a78bfa' }}>Excellent</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────── */}
      <section id="features" className="py-28 px-6 sm:px-10">
        <div className="max-w-6xl mx-auto">

          <div className="text-center mb-16">
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: 'var(--lc-orange)' }}>
              Features
            </p>
            <h2 className="text-4xl font-extrabold tracking-tight mb-4" style={{ color: 'var(--lc-text)' }}>
              Everything you need to
              <br />
              <span className="gradient-text">land the job</span>
            </h2>
            <p className="text-sm max-w-md mx-auto" style={{ color: 'var(--lc-text-3)' }}>
              From AI-powered mock interviews to real-time live sessions — one platform, end to end.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map(f => (
              <div
                key={f.title}
                className="feature-card rounded-2xl border p-6 flex flex-col gap-4"
                style={{ backgroundColor: 'var(--lc-surface)', borderColor: 'var(--lc-border)' }}
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: f.bg, color: f.color }}>
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1.5" style={{ color: 'var(--lc-text)' }}>{f.title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--lc-text-3)' }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────────── */}
      <section id="how-it-works" className="py-28 px-6 sm:px-10 border-t" style={{ borderColor: 'var(--lc-border)' }}>
        <div className="max-w-4xl mx-auto">

          <div className="text-center mb-16">
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: 'var(--lc-orange)' }}>
              How it works
            </p>
            <h2 className="text-4xl font-extrabold tracking-tight" style={{ color: 'var(--lc-text)' }}>
              Up and running in{' '}
              <span className="gradient-text">minutes</span>
            </h2>
          </div>

          <div className="relative flex flex-col gap-0">
            {/* Connector line */}
            <div
              className="absolute left-8 top-12 bottom-12 w-px hidden sm:block"
              style={{ background: 'linear-gradient(to bottom, transparent, var(--lc-border) 20%, var(--lc-border) 80%, transparent)' }}
            />

            {STEPS.map((step, i) => (
              <div key={i} className="relative flex gap-8 py-8">
                <div
                  className="relative z-10 w-16 h-16 rounded-2xl border-2 flex items-center justify-center shrink-0 font-bold text-base"
                  style={{
                    backgroundColor: 'var(--lc-surface)',
                    borderColor: i === 0 ? 'var(--lc-orange)' : 'var(--lc-border)',
                    color: i === 0 ? 'var(--lc-orange)' : 'var(--lc-text-3)',
                  }}
                >
                  {step.n}
                </div>
                <div className="flex-1 pt-3">
                  <h3 className="font-semibold text-base mb-1.5" style={{ color: 'var(--lc-text)' }}>{step.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--lc-text-3)' }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ─────────────────────────────────────────────── */}
      <section className="py-24 px-6 sm:px-10">
        <div className="max-w-3xl mx-auto">
          <div
            className="relative rounded-3xl border p-12 text-center overflow-hidden"
            style={{ backgroundColor: 'var(--lc-surface)', borderColor: 'rgba(255,161,22,0.25)' }}
          >
            {/* Glow */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(255,161,22,0.08) 0%, transparent 70%)',
              }}
            />
            <div className="relative">
              <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: 'var(--lc-orange)' }}>
                Ready to start?
              </p>
              <h2 className="text-4xl font-extrabold tracking-tight mb-4" style={{ color: 'var(--lc-text)' }}>
                Your next offer starts here
              </h2>
              <p className="text-sm max-w-sm mx-auto mb-8" style={{ color: 'var(--lc-text-3)' }}>
                Join engineers who use LevelUp.io to practice smarter, get real feedback, and walk into interviews with confidence.
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <Link to="/register" className="lc-btn-primary" style={{ fontSize: '14px', padding: '11px 32px', borderRadius: '10px' }}>
                  Create free account
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <Link to="/login" className="lc-btn-secondary" style={{ fontSize: '14px', padding: '11px 24px', borderRadius: '10px' }}>
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="border-t px-6 sm:px-10 py-8" style={{ borderColor: 'var(--lc-border)' }}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <LCLogo size={22} />
            <span className="text-sm font-semibold" style={{ color: 'var(--lc-text-2)' }}>
              LevelUp<span style={{ color: 'var(--lc-orange)' }}>.io</span>
            </span>
          </div>
          <p className="text-xs" style={{ color: 'var(--lc-muted)' }}>
            © 2025 LevelUp.io · Built for engineers who want to level up
          </p>
          <div className="flex items-center gap-5">
            <Link to="/login" className="text-xs transition-colors" style={{ color: 'var(--lc-text-3)' }}
              onMouseEnter={e => e.target.style.color = 'var(--lc-text)'}
              onMouseLeave={e => e.target.style.color = 'var(--lc-text-3)'}>Sign in</Link>
            <Link to="/register" className="text-xs transition-colors" style={{ color: 'var(--lc-text-3)' }}
              onMouseEnter={e => e.target.style.color = 'var(--lc-text)'}
              onMouseLeave={e => e.target.style.color = 'var(--lc-text-3)'}>Register</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
