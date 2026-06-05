import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import Editor from '@monaco-editor/react'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { MonacoBinding } from 'y-monaco'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

// ─── Constants ──────────────────────────────────────────────────────────────

const LANGUAGES = ['javascript', 'typescript', 'python', 'java', 'cpp', 'go', 'rust', 'sql']

const ROLE_COLORS = {
  ADMIN:       { bg: 'rgba(255,55,95,0.15)',  color: '#ff375f', label: 'Admin' },
  INTERVIEWER: { bg: 'rgba(96,165,250,0.15)', color: '#60a5fa', label: 'Interviewer' },
  CANDIDATE:   { bg: 'rgba(0,184,163,0.15)',  color: '#00b8a3', label: 'Candidate' },
}

const DIFF_CFG = {
  EASY:   { label: 'Easy',   color: '#00b8a3', bg: 'rgba(0,184,163,0.12)' },
  MEDIUM: { label: 'Medium', color: '#ffc01e', bg: 'rgba(255,192,30,0.12)' },
  HARD:   { label: 'Hard',   color: '#ff375f', bg: 'rgba(255,55,95,0.12)' },
}

const CURSOR_COLORS = [
  '#60a5fa', '#00b8a3', '#ffc01e', '#ff375f',
  '#a78bfa', '#34d399', '#fb923c', '#f472b6',
]

function getUserColor(userId) {
  if (!userId) return CURSOR_COLORS[0]
  const sum = String(userId).split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return CURSOR_COLORS[sum % CURSOR_COLORS.length]
}

const LC_DARK_THEME = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '6b7280', fontStyle: 'italic' },
    { token: 'keyword', foreground: 'c084fc' },
    { token: 'string', foreground: '86efac' },
    { token: 'number', foreground: 'fca5a5' },
    { token: 'type', foreground: '67e8f9' },
  ],
  colors: {
    'editor.background': '#1a1a1a',
    'editor.foreground': '#eff2f6',
    'editor.lineHighlightBackground': '#282828',
    'editor.selectionBackground': '#ffa11640',
    'editor.inactiveSelectionBackground': '#ffa11620',
    'editorLineNumber.foreground': '#4a4a4a',
    'editorLineNumber.activeForeground': '#ffa116',
    'editorCursor.foreground': '#ffa116',
    'editorIndentGuide.background1': '#3c3c3c',
    'editorWhitespace.foreground': '#3c3c3c',
    'editorBracketMatch.background': '#ffa11630',
    'editorBracketMatch.border': '#ffa11680',
    'scrollbarSlider.background': '#3c3c3c80',
    'scrollbarSlider.hoverBackground': '#4a4a4a80',
    'minimap.background': '#1a1a1a',
  },
}

const EDITOR_OPTIONS = {
  fontSize: 14,
  fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
  fontLigatures: true,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  lineNumbers: 'on',
  roundedSelection: true,
  padding: { top: 16, bottom: 16 },
  folding: true,
  wordWrap: 'off',
  tabSize: 2,
  insertSpaces: true,
  automaticLayout: true,
  quickSuggestions: true,
  formatOnPaste: false,
  bracketPairColorization: { enabled: true },
  renderLineHighlight: 'line',
  smoothScrolling: true,
  cursorBlinking: 'smooth',
  cursorSmoothCaretAnimation: 'on',
}

// ─── Small components ────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <span className="flex items-center gap-0.5">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-1 h-1 rounded-full"
          style={{
            backgroundColor: '#00b8a3',
            animation: `typingBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </span>
  )
}

function DiffBadge({ difficulty }) {
  const d = DIFF_CFG[difficulty] || DIFF_CFG.EASY
  return (
    <span
      className="text-xs font-medium px-2 py-0.5 rounded-full"
      style={{ backgroundColor: d.bg, color: d.color }}
    >
      {d.label}
    </span>
  )
}

function TagChip({ tag }) {
  return (
    <span
      className="text-xs px-2 py-0.5 rounded"
      style={{ backgroundColor: 'var(--lc-surface-3)', color: 'var(--lc-text-3)' }}
    >
      {tag}
    </span>
  )
}

function ChatMessage({ msg, isOwn }) {
  const r = ROLE_COLORS[msg.role] || { color: '#808080' }
  const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return (
    <div className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
      <span
        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
        style={{ backgroundColor: `${r.color}22`, color: r.color }}
      >
        {msg.name?.[0]?.toUpperCase()}
      </span>
      <div className={`max-w-[78%] flex flex-col gap-0.5 ${isOwn ? 'items-end' : 'items-start'}`}>
        {!isOwn && (
          <span className="text-xs" style={{ color: r.color }}>{msg.name}</span>
        )}
        <div
          className="px-3 py-2 rounded-xl text-sm break-words"
          style={{
            backgroundColor: isOwn ? 'var(--lc-orange-dim)' : 'var(--lc-surface-2)',
            color: isOwn ? 'var(--lc-orange)' : 'var(--lc-text-2)',
            border: isOwn ? '1px solid rgba(255,161,22,0.3)' : '1px solid var(--lc-border)',
          }}
        >
          {msg.message}
        </div>
        <span style={{ color: 'var(--lc-muted)', fontSize: '10px' }}>{time}</span>
      </div>
    </div>
  )
}

// ─── Problem Panel ───────────────────────────────────────────────────────────

function ProblemPanel({ problem, user, onSelectProblem }) {
  const [tab, setTab] = useState('description')
  const canSelect = user?.role === 'INTERVIEWER' || user?.role === 'ADMIN'

  if (!problem) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: 'var(--lc-surface-3)', border: '1px solid var(--lc-border)' }}
        >
          <svg className="w-7 h-7" style={{ color: 'var(--lc-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--lc-text-2)' }}>No problem selected</p>
          <p className="text-xs mt-1" style={{ color: 'var(--lc-muted)' }}>
            {canSelect
              ? 'Select a problem to begin the interview.'
              : 'Wait for the interviewer to select a problem.'}
          </p>
        </div>
        {canSelect && (
          <button onClick={onSelectProblem} className="lc-btn-primary text-xs">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Select Problem
          </button>
        )}
      </div>
    )
  }

  const TABS = ['description', 'examples', 'constraints']

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Problem header */}
      <div
        className="shrink-0 px-4 pt-4 pb-3 border-b"
        style={{ borderColor: 'var(--lc-border)' }}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <h2 className="text-sm font-semibold leading-snug" style={{ color: 'var(--lc-text)' }}>
            {problem.title}
          </h2>
          <DiffBadge difficulty={problem.difficulty} />
        </div>
        <div className="flex flex-wrap gap-1 mb-3">
          {problem.tags?.map(tag => <TagChip key={tag} tag={tag} />)}
        </div>
        {/* Tab bar */}
        <div className="flex gap-0.5">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors"
              style={{
                backgroundColor: tab === t ? 'var(--lc-surface-3)' : 'transparent',
                color: tab === t ? 'var(--lc-text)' : 'var(--lc-text-3)',
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
        {tab === 'description' && (
          <div className="text-sm leading-relaxed lc-problem-content" style={{ color: 'var(--lc-text-2)' }}>
            {problem.description?.includes('<') ? (
              <div dangerouslySetInnerHTML={{ __html: problem.description }} />
            ) : (
              problem.description?.split('\n').map((line, i) => {
                const parts = line.split(/(`[^`]+`|\*\*[^*]+\*\*)/).map((part, j) => {
                  if (part.startsWith('`') && part.endsWith('`')) {
                    return (
                      <code
                        key={j}
                        className="px-1.5 py-0.5 rounded text-xs font-mono mx-0.5"
                        style={{ backgroundColor: 'var(--lc-surface-3)', color: '#67e8f9' }}
                      >
                        {part.slice(1, -1)}
                      </code>
                    )
                  }
                  if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={j} style={{ color: 'var(--lc-text)' }}>{part.slice(2, -2)}</strong>
                  }
                  return part
                })
                return line.startsWith('-') || line.match(/^\d\./) ? (
                  <li key={i} className="ml-4 mb-1">{parts}</li>
                ) : (
                  <p key={i} className={line ? 'mb-3' : 'mb-1'}>{parts}</p>
                )
              })
            )}
          </div>
        )}

        {tab === 'examples' && (
          <div className="flex flex-col gap-4">
            {problem.examples?.map((ex, i) => (
              <div key={i}>
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--lc-text-3)' }}>
                  Example {i + 1}
                </p>
                <div
                  className="rounded-lg p-3 text-xs font-mono"
                  style={{ backgroundColor: 'var(--lc-surface-2)', border: '1px solid var(--lc-border)' }}
                >
                  <div className="mb-1">
                    <span style={{ color: 'var(--lc-text-3)' }}>Input: </span>
                    <span style={{ color: 'var(--lc-text)' }}>{ex.input}</span>
                  </div>
                  <div className="mb-1">
                    <span style={{ color: 'var(--lc-text-3)' }}>Output: </span>
                    <span style={{ color: '#86efac' }}>{ex.output}</span>
                  </div>
                  {ex.explanation && (
                    <div className="mt-2 pt-2 border-t" style={{ borderColor: 'var(--lc-border)' }}>
                      <span style={{ color: 'var(--lc-text-3)' }}>Explanation: </span>
                      <span style={{ color: 'var(--lc-text-2)' }}>{ex.explanation}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'constraints' && (
          <ul className="flex flex-col gap-2">
            {problem.constraints?.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-xs">
                <span className="mt-1 w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: 'var(--lc-orange)' }} />
                <code
                  className="font-mono leading-relaxed"
                  style={{ color: 'var(--lc-text-2)' }}
                >
                  {c}
                </code>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer: change problem (interviewer only) */}
      {canSelect && (
        <div
          className="shrink-0 p-3 border-t"
          style={{ borderColor: 'var(--lc-border)' }}
        >
          <button
            onClick={onSelectProblem}
            className="w-full py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5"
            style={{
              backgroundColor: 'var(--lc-surface-3)',
              color: 'var(--lc-text-3)',
              border: '1px solid var(--lc-border)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = 'var(--lc-surface-2)'
              e.currentTarget.style.color = 'var(--lc-text-2)'
              e.currentTarget.style.borderColor = 'var(--lc-border-2)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'var(--lc-surface-3)'
              e.currentTarget.style.color = 'var(--lc-text-3)'
              e.currentTarget.style.borderColor = 'var(--lc-border)'
            }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Change Problem
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Problem Picker Modal ────────────────────────────────────────────────────

function ProblemPicker({ problems, loading, onSelect, onClose }) {
  const [search, setSearch] = useState('')
  const filtered = problems.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-xl rounded-2xl overflow-hidden flex flex-col"
        style={{
          backgroundColor: 'var(--lc-surface)',
          border: '1px solid var(--lc-border)',
          maxHeight: '80vh',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: 'var(--lc-border)' }}
        >
          <div>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--lc-text)' }}>
              Select a Problem
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--lc-muted)' }}>
              Choose a problem for this live session
            </p>
          </div>
          <button
            onClick={onClose}
            className="lc-btn-ghost p-1.5"
            style={{ color: 'var(--lc-text-3)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--lc-border)' }}>
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
              style={{ color: 'var(--lc-muted)' }}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search problems or tags…"
              className="lc-input pl-8 text-sm"
            />
          </div>
        </div>

        {/* Problem list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div
                className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: 'var(--lc-border)', borderTopColor: 'var(--lc-orange)' }}
              />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-sm py-12" style={{ color: 'var(--lc-muted)' }}>
              No problems found
            </p>
          ) : (
            filtered.map((p, i) => (
              <button
                key={p.id}
                onClick={() => onSelect(p.id)}
                className="w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors border-b last:border-b-0"
                style={{ borderColor: 'var(--lc-border)' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--lc-surface-2)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <span
                  className="w-5 text-xs font-mono text-right shrink-0"
                  style={{ color: 'var(--lc-muted)' }}
                >
                  {i + 1}.
                </span>
                <span className="flex-1 text-sm font-medium" style={{ color: 'var(--lc-text)' }}>
                  {p.title}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  {p.tags?.slice(0, 2).map(tag => (
                    <span
                      key={tag}
                      className="hidden sm:inline text-xs px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: 'var(--lc-surface-3)', color: 'var(--lc-text-3)' }}
                    >
                      {tag}
                    </span>
                  ))}
                  <DiffBadge difficulty={p.difficulty} />
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Test Results Panel ──────────────────────────────────────────────────────

function TestResults({ results, onClose }) {
  if (!results) return null

  if (!results.supported) {
    return (
      <div
        className="shrink-0 border-t px-4 py-3 flex items-center justify-between"
        style={{ backgroundColor: 'var(--lc-surface-2)', borderColor: 'var(--lc-border)' }}
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" style={{ color: '#ffc01e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs" style={{ color: 'var(--lc-text-2)' }}>{results.message}</span>
        </div>
        <button onClick={onClose} className="lc-btn-ghost p-1" style={{ color: 'var(--lc-text-3)' }}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    )
  }

  const { summary, results: cases } = results
  const allPassed = summary.allPassed

  return (
    <div
      className="shrink-0 border-t flex flex-col"
      style={{
        backgroundColor: 'var(--lc-surface-2)',
        borderColor: 'var(--lc-border)',
        maxHeight: '220px',
      }}
    >
      {/* Results header */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b shrink-0"
        style={{ borderColor: 'var(--lc-border)' }}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            {allPassed ? (
              <svg className="w-4 h-4" style={{ color: '#00b8a3' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" style={{ color: '#ff375f' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span
              className="text-xs font-semibold"
              style={{ color: allPassed ? '#00b8a3' : '#ff375f' }}
            >
              {allPassed ? 'All Tests Passed' : `${summary.passed}/${summary.total} Passed`}
            </span>
          </div>
          <span className="text-xs" style={{ color: 'var(--lc-muted)' }}>
            {summary.failed > 0 && `${summary.failed} failed`}
          </span>
        </div>
        <button onClick={onClose} className="lc-btn-ghost p-1" style={{ color: 'var(--lc-text-3)' }}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Cases */}
      <div className="overflow-y-auto flex-1">
        {cases.map(tc => (
          <div
            key={tc.index}
            className="px-4 py-2.5 border-b last:border-b-0 flex flex-col gap-1"
            style={{ borderColor: 'var(--lc-border)' }}
          >
            <div className="flex items-center gap-2">
              {tc.passed ? (
                <svg className="w-3.5 h-3.5 shrink-0" style={{ color: '#00b8a3' }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5 shrink-0" style={{ color: '#ff375f' }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              <span className="text-xs font-medium" style={{ color: tc.passed ? '#00b8a3' : '#ff375f' }}>
                Case {tc.index}
              </span>
              <span className="text-xs font-mono truncate" style={{ color: 'var(--lc-text-3)' }}>
                {tc.input}
              </span>
              <span className="ml-auto text-xs font-mono" style={{ color: 'var(--lc-muted)' }}>
                {tc.runtime}ms
              </span>
            </div>
            {!tc.passed && (
              <div className="ml-5 flex gap-4 text-xs font-mono">
                <span>
                  <span style={{ color: 'var(--lc-muted)' }}>Expected: </span>
                  <span style={{ color: '#86efac' }}>{JSON.stringify(tc.expected)}</span>
                </span>
                <span>
                  <span style={{ color: 'var(--lc-muted)' }}>Got: </span>
                  <span style={{ color: tc.error ? '#ff375f' : '#fca5a5' }}>
                    {tc.error ? tc.error : JSON.stringify(tc.got)}
                  </span>
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function LiveInterviewRoom() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  // Connection
  const [connected, setConnected] = useState(false)
  const [yjsConnected, setYjsConnected] = useState(false)
  const [roomError, setRoomError] = useState(null)

  // Room state
  const [participants, setParticipants] = useState([])
  const [language, setLanguage] = useState('javascript')
  const [joinNotice, setJoinNotice] = useState(null)
  const [activeUsers, setActiveUsers] = useState([])
  const [typingUsers, setTypingUsers] = useState([])

  // Chat
  const [messages, setMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [chatTypingUsers, setChatTypingUsers] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  // Problem feature
  const [problem, setProblem] = useState(null)
  const [problemList, setProblemList] = useState([])
  const [problemsLoading, setProblemsLoading] = useState(false)
  const [showPicker, setShowPicker] = useState(false)

  // Code run
  const [testResults, setTestResults] = useState(null)
  const [isRunning, setIsRunning] = useState(false)
  const [showResults, setShowResults] = useState(false)

  // Mobile tab
  const [mobileTab, setMobileTab] = useState('code')

  const socketRef = useRef(null)
  const messagesEndRef = useRef(null)
  const chatInputRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const chatTypingTimeoutRef = useRef(null)
  const chatFocusedRef = useRef(false)
  const ydocRef = useRef(null)
  const providerRef = useRef(null)
  const bindingRef = useRef(null)
  const editorRef = useRef(null)
  const monacoRef = useRef(null)

  // ── Fetch problem by ID ─────────────────────────────────────────────────
  const fetchProblem = useCallback(async (id, shouldLoadCode = false) => {
    try {
      const res = await api.get(`/problems/${id}`)
      const p = res.data.data
      setProblem(p)
      setTestResults(null)
      setShowResults(false)
      if (shouldLoadCode && ydocRef.current) {
        const code = p.starterCode?.javascript || '// Write your solution here\n'
        const ytext = ydocRef.current.getText('code')
        ydocRef.current.transact(() => {
          ytext.delete(0, ytext.length)
          ytext.insert(0, code)
        })
      }
    } catch (e) {
      console.error('Failed to fetch problem:', e)
    }
  }, [])

  // ── Fetch problems list for picker ──────────────────────────────────────
  const openPicker = useCallback(async () => {
    setShowPicker(true)
    if (problemList.length > 0) return
    setProblemsLoading(true)
    try {
      const res = await api.get('/problems')
      setProblemList(res.data.data)
    } catch (e) {
      console.error('Failed to load problems:', e)
    } finally {
      setProblemsLoading(false)
    }
  }, [problemList.length])

  // ── Select problem (emit socket event) ─────────────────────────────────
  const selectProblem = useCallback((problemId) => {
    socketRef.current?.emit('select-problem', { sessionId, problemId })
    setShowPicker(false)
  }, [sessionId])

  // ── Run code ────────────────────────────────────────────────────────────
  const runCode = useCallback(async () => {
    if (!problem || !editorRef.current) return
    const code = editorRef.current.getValue()
    setIsRunning(true)
    setShowResults(true)
    try {
      const res = await api.post(`/problems/${problem.id}/run`, { code, language })
      setTestResults(res.data.data)
    } catch (e) {
      console.error('Run code error:', e)
      setTestResults({
        supported: false,
        message: e.response?.data?.message || 'Execution failed. Please try again.',
      })
    } finally {
      setIsRunning(false)
    }
  }, [problem, language])

  // ── Socket.IO ───────────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('token')
    const s = io('http://localhost:3000', {
      auth: { token },
      transports: ['websocket'],
    })
    socketRef.current = s

    s.on('connect', () => {
      setConnected(true)
      s.emit('join-room', { sessionId })
    })
    s.on('connect_error', err => console.error('Socket error:', err.message))
    s.on('disconnect', () => setConnected(false))
    s.on('room-error', ({ message }) => {
      s.disconnect()
      setRoomError(message)
    })

    s.on('room-state', ({ participants, language: lang, messages, selectedProblem }) => {
      setParticipants(participants)
      if (lang) setLanguage(lang)
      setMessages(messages)
      if (selectedProblem) fetchProblem(selectedProblem, false)
    })

    s.on('user-joined', ({ name, participants }) => {
      setParticipants(participants)
      setJoinNotice(`${name} joined`)
      setTimeout(() => setJoinNotice(null), 3000)
    })
    s.on('user-left', ({ userId, name, participants }) => {
      setParticipants(participants)
      setChatTypingUsers(prev => prev.filter(u => u.userId !== userId))
      setJoinNotice(`${name} left`)
      setTimeout(() => setJoinNotice(null), 3000)
    })

    s.on('language-change', ({ language: lang }) => setLanguage(lang))

    s.on('chat-message', msg => {
      setMessages(prev => [...prev, msg])
      setChatTypingUsers(prev => prev.filter(u => u.userId !== msg.userId))
      if (!chatFocusedRef.current) setUnreadCount(prev => prev + 1)
    })

    s.on('chat-typing', ({ userId, name, role, isTyping }) => {
      setChatTypingUsers(prev => {
        if (isTyping) {
          if (prev.find(u => u.userId === userId)) return prev
          return [...prev, { userId, name, role }]
        }
        return prev.filter(u => u.userId !== userId)
      })
    })

    s.on('problem-selected', ({ problemId, selectedBy, selectedByName }) => {
      const isSelf = selectedBy === user?.id
      fetchProblem(problemId, isSelf)
      setJoinNotice(`${selectedByName} selected a new problem`)
      setTimeout(() => setJoinNotice(null), 3000)
    })

    return () => {
      clearTimeout(chatTypingTimeoutRef.current)
      s.disconnect()
      socketRef.current = null
    }
  }, [sessionId, user?.id, fetchProblem])

  // ── Yjs ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const ydoc = new Y.Doc()
    const provider = new WebsocketProvider('ws://localhost:3001', sessionId, ydoc, { connect: true })

    ydocRef.current = ydoc
    providerRef.current = provider

    provider.on('status', ({ status }) => setYjsConnected(status === 'connected'))

    const ymeta = ydoc.getMap('meta')
    ymeta.observe(() => {
      const lang = ymeta.get('language')
      if (lang) {
        setLanguage(lang)
        if (editorRef.current && monacoRef.current) {
          monacoRef.current.editor.setModelLanguage(editorRef.current.getModel(), lang)
        }
      }
    })

    provider.awareness.on('change', () => {
      const myClientID = provider.awareness.clientID
      const entries = Array.from(provider.awareness.getStates().entries())
      setActiveUsers(entries.filter(([, s]) => s.user).map(([, s]) => s.user))
      setTypingUsers(
        entries
          .filter(([cid, s]) => s.user && s.isTyping && cid !== myClientID)
          .map(([, s]) => s.user)
      )
    })

    if (user) {
      provider.awareness.setLocalStateField('user', {
        name: user.name,
        color: getUserColor(user.id),
        colorLight: `${getUserColor(user.id)}33`,
        role: user.role,
      })
    }

    if (editorRef.current && monacoRef.current) {
      createBinding(ydoc, provider, editorRef.current, monacoRef.current)
    }

    return () => {
      clearTimeout(typingTimeoutRef.current)
      bindingRef.current?.destroy()
      bindingRef.current = null
      provider.destroy()
      ydoc.destroy()
      ydocRef.current = null
      providerRef.current = null
    }
  }, [sessionId, user])

  function createBinding(ydoc, provider, editor, monaco) {
    if (bindingRef.current) bindingRef.current.destroy()
    const ytext = ydoc.getText('code')
    bindingRef.current = new MonacoBinding(ytext, editor.getModel(), new Set([editor]), provider.awareness)
  }

  const handleEditorDidMount = useCallback((editor, monaco) => {
    monaco.editor.defineTheme('lc-dark', LC_DARK_THEME)
    monaco.editor.setTheme('lc-dark')
    editorRef.current = editor
    monacoRef.current = monaco

    editor.onDidChangeModelContent(() => {
      if (editor.hasTextFocus() && providerRef.current) {
        providerRef.current.awareness.setLocalStateField('isTyping', true)
        clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = setTimeout(() => {
          providerRef.current?.awareness.setLocalStateField('isTyping', false)
        }, 1500)
      }
    })

    // Ctrl+Enter to run code
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      runCode()
    })

    if (ydocRef.current && providerRef.current) {
      createBinding(ydocRef.current, providerRef.current, editor, monaco)
    }
  }, [runCode])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleLanguageChange = useCallback((lang) => {
    setLanguage(lang)
    ydocRef.current?.getMap('meta').set('language', lang)
    socketRef.current?.emit('language-change', { sessionId, language: lang })
    if (editorRef.current && monacoRef.current) {
      monacoRef.current.editor.setModelLanguage(editorRef.current.getModel(), lang)
    }
    // Load new starter code if problem is selected
    if (problem?.starterCode?.[lang]) {
      const ytext = ydocRef.current?.getText('code')
      if (ytext) {
        ydocRef.current.transact(() => {
          ytext.delete(0, ytext.length)
          ytext.insert(0, problem.starterCode[lang])
        })
      }
    }
  }, [sessionId, problem])

  const emitChatTyping = useCallback((isTyping) => {
    socketRef.current?.emit('chat-typing', { sessionId, isTyping })
  }, [sessionId])

  const handleChatInput = useCallback((e) => {
    setChatInput(e.target.value)
    emitChatTyping(true)
    clearTimeout(chatTypingTimeoutRef.current)
    chatTypingTimeoutRef.current = setTimeout(() => emitChatTyping(false), 1500)
  }, [emitChatTyping])

  const sendMessage = useCallback(() => {
    const msg = chatInput.trim()
    if (!msg || !socketRef.current) return
    clearTimeout(chatTypingTimeoutRef.current)
    emitChatTyping(false)
    socketRef.current.emit('chat-message', { sessionId, message: msg })
    setChatInput('')
    chatInputRef.current?.focus()
  }, [chatInput, sessionId, emitChatTyping])

  const handleChatKey = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }, [sendMessage])

  const isFullyConnected = connected && yjsConnected
  const canSelectProblem = user?.role === 'INTERVIEWER' || user?.role === 'ADMIN'

  // ── Render ──────────────────────────────────────────────────────────────
  if (roomError) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--lc-bg)' }}>
        <div className="flex flex-col items-center gap-4 text-center max-w-sm px-6">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'var(--lc-error-dim)', border: '1px solid rgba(255,55,95,0.3)' }}>
            <svg className="w-7 h-7" style={{ color: '#ff375f' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <p className="text-sm font-semibold" style={{ color: 'var(--lc-text)' }}>{roomError}</p>
          <button onClick={() => navigate('/dashboard')} className="lc-btn-primary text-xs">Back to Dashboard</button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--lc-bg)' }}>
      <style>{`
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-3px); opacity: 1; }
        }
      `}</style>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div
        className="shrink-0 flex items-center justify-between px-4 h-14 border-b gap-3"
        style={{ backgroundColor: 'var(--lc-nav)', borderColor: 'var(--lc-border)' }}
      >
        {/* Left */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => navigate('/dashboard')}
            className="lc-btn-ghost text-xs flex items-center gap-1.5"
            style={{ color: 'var(--lc-text-3)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">Dashboard</span>
          </button>

          <div className="h-5 w-px" style={{ backgroundColor: 'var(--lc-border)' }} />

          <div className="flex items-center gap-2">
            <span className="relative flex w-2.5 h-2.5">
              {isFullyConnected && (
                <span
                  className="absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping"
                  style={{ backgroundColor: '#00b8a3' }}
                />
              )}
              <span
                className="relative w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: isFullyConnected ? '#00b8a3' : 'var(--lc-orange)' }}
              />
            </span>
            <span className="font-semibold text-sm" style={{ color: 'var(--lc-text)' }}>
              Live Room
            </span>
            <span
              className="hidden sm:inline px-2 py-0.5 rounded font-mono text-xs"
              style={{ backgroundColor: 'var(--lc-surface-3)', color: 'var(--lc-muted)' }}
            >
              #{sessionId}
            </span>
          </div>
        </div>

        {/* Center: participants */}
        <div className="hidden lg:flex items-center gap-2 flex-1 justify-center overflow-x-auto">
          {participants.length === 0 ? (
            <span className="text-xs" style={{ color: 'var(--lc-muted)' }}>Waiting for participants…</span>
          ) : (
            participants.map(p => {
              const r = ROLE_COLORS[p.role] || { bg: 'rgba(128,128,128,0.15)', color: '#808080', label: p.role }
              const initials = p.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'
              return (
                <div
                  key={p.userId}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs shrink-0"
                  style={{ backgroundColor: 'var(--lc-surface-2)', border: '1px solid var(--lc-border)' }}
                >
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ backgroundColor: r.bg, color: r.color }}
                  >
                    {initials}
                  </span>
                  <span style={{ color: 'var(--lc-text-2)' }}>
                    {p.name}{p.userId === user?.id && ' (you)'}
                  </span>
                  <span
                    className="px-1 rounded text-xs"
                    style={{ backgroundColor: r.bg, color: r.color, fontSize: '10px' }}
                  >
                    {r.label}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#00b8a3' }} />
                </div>
              )
            })
          )}
        </div>

        {/* Right: status */}
        <div className="shrink-0 flex items-center gap-3">
          {activeUsers.length > 1 && (
            <div className="hidden sm:flex items-center">
              {activeUsers.slice(0, 4).map((u, i) => (
                <span
                  key={i}
                  className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold border-2"
                  style={{
                    backgroundColor: u.color + '33',
                    color: u.color,
                    borderColor: u.color,
                    marginLeft: i > 0 ? '-6px' : 0,
                  }}
                  title={u.name}
                >
                  {u.name?.[0]?.toUpperCase()}
                </span>
              ))}
            </div>
          )}
          <span
            className="text-xs px-2.5 py-1 rounded-full font-medium"
            style={{
              backgroundColor: isFullyConnected ? 'rgba(0,184,163,0.12)' : 'var(--lc-surface-3)',
              color: isFullyConnected ? '#00b8a3' : 'var(--lc-muted)',
            }}
          >
            {isFullyConnected ? '● Live' : connected ? '○ Syncing' : '○ Connecting'}
          </span>
        </div>
      </div>

      {/* ── Join/leave/problem toast ─────────────────────────────────────── */}
      {joinNotice && (
        <div
          className="shrink-0 text-center text-xs py-1.5 animate-pulse"
          style={{ backgroundColor: 'var(--lc-surface-2)', color: 'var(--lc-text-3)' }}
        >
          {joinNotice}
        </div>
      )}

      {/* ── Main 3-pane layout ──────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── Problem Panel ─────────────────────────────────────────────── */}
        <div
          className="flex flex-col border-r min-h-0 shrink-0"
          style={{
            width: '300px',
            borderColor: 'var(--lc-border)',
            backgroundColor: 'var(--lc-surface)',
          }}
        >
          <ProblemPanel problem={problem} user={user} onSelectProblem={openPicker} />
        </div>

        {/* ── Code Editor + Results ──────────────────────────────────────── */}
        <div
          className="flex flex-col flex-1 min-h-0 min-w-0"
          style={{ borderRight: '1px solid var(--lc-border)' }}
        >
          {/* Editor toolbar */}
          <div
            className="flex items-center gap-3 px-4 py-2 border-b shrink-0"
            style={{ backgroundColor: 'var(--lc-surface-2)', borderColor: 'var(--lc-border)' }}
          >
            {/* Language selector */}
            <div className="relative">
              <select
                value={language}
                onChange={e => handleLanguageChange(e.target.value)}
                className="lc-input text-xs pr-6 appearance-none cursor-pointer"
                style={{ padding: '4px 20px 4px 8px', minWidth: '110px', backgroundColor: 'var(--lc-surface-3)' }}
              >
                {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              <svg
                className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none"
                style={{ color: 'var(--lc-text-3)' }}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {/* Run button */}
            <button
              onClick={runCode}
              disabled={!problem || isRunning}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                backgroundColor: problem && !isRunning ? 'var(--lc-orange)' : 'var(--lc-surface-3)',
                color: problem && !isRunning ? '#1a1a1a' : 'var(--lc-muted)',
                cursor: problem && !isRunning ? 'pointer' : 'not-allowed',
              }}
              title={problem ? 'Run Code (Ctrl+Enter)' : 'Select a problem first'}
            >
              {isRunning ? (
                <div
                  className="w-3 h-3 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: 'rgba(0,0,0,0.3)', borderTopColor: 'rgba(0,0,0,0.7)' }}
                />
              ) : (
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
              {isRunning ? 'Running…' : 'Run'}
            </button>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Typing indicator */}
            {typingUsers.length > 0 && (
              <span
                className="flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full hidden sm:flex"
                style={{ backgroundColor: 'rgba(0,184,163,0.1)', color: '#00b8a3', border: '1px solid rgba(0,184,163,0.3)' }}
              >
                <TypingDots />
                <span>{typingUsers.map(u => u.name).join(', ')} typing…</span>
              </span>
            )}

            {/* Collaborative badge */}
            {yjsConnected && (
              <span
                className="hidden sm:flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full"
                style={{ backgroundColor: 'rgba(0,184,163,0.1)', color: '#00b8a3', border: '1px solid rgba(0,184,163,0.25)' }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                Collaborative
              </span>
            )}
          </div>

          {/* Monaco editor */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <Editor
              height="100%"
              language={language}
              theme="lc-dark"
              options={EDITOR_OPTIONS}
              onMount={handleEditorDidMount}
              loading={
                <div
                  className="flex items-center justify-center h-full"
                  style={{ backgroundColor: '#1a1a1a', color: 'var(--lc-muted)' }}
                >
                  <span className="text-sm">Loading editor…</span>
                </div>
              }
            />
          </div>

          {/* Test results */}
          {showResults && (
            <TestResults
              results={testResults}
              onClose={() => setShowResults(false)}
            />
          )}
        </div>

        {/* ── Chat Panel ────────────────────────────────────────────────── */}
        <div
          className="flex flex-col min-h-0 shrink-0"
          style={{ width: '300px', backgroundColor: 'var(--lc-surface)' }}
        >
          <div className="flex flex-col min-h-0 h-full">

            {/* Participants strip */}
            <div
              className="shrink-0 px-3 py-2 border-b flex flex-col gap-2"
              style={{ backgroundColor: 'var(--lc-surface-2)', borderColor: 'var(--lc-border)' }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium" style={{ color: 'var(--lc-text-3)' }}>
                  Participants
                </span>
                <span
                  className="text-xs px-1.5 py-0.5 rounded-full"
                  style={{ backgroundColor: 'var(--lc-surface-3)', color: 'var(--lc-muted)' }}
                >
                  {participants.length}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {participants.length === 0 ? (
                  <span className="text-xs" style={{ color: 'var(--lc-muted)' }}>Waiting…</span>
                ) : (
                  participants.map(p => {
                    const r = ROLE_COLORS[p.role] || { color: '#808080', label: p.role }
                    return (
                      <div
                        key={p.userId}
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs"
                        style={{ backgroundColor: `${r.color}15`, border: `1px solid ${r.color}30` }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#00b8a3' }} />
                        <span style={{ color: r.color }}>{p.name}</span>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Chat header */}
            <div
              className="flex items-center justify-between px-4 py-2 border-b shrink-0"
              style={{ backgroundColor: 'var(--lc-surface-2)', borderColor: 'var(--lc-border)' }}
            >
              <div className="flex items-center gap-2">
                <div className="relative">
                  <svg className="w-4 h-4" style={{ color: 'var(--lc-text-3)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {unreadCount > 0 && (
                    <span
                      className="absolute -top-1.5 -right-1.5 min-w-3.5 h-3.5 px-0.5 rounded-full flex items-center justify-center font-bold leading-none"
                      style={{ backgroundColor: 'var(--lc-orange)', color: '#1a1a1a', fontSize: '9px' }}
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </div>
                <span className="text-xs font-medium" style={{ color: 'var(--lc-text-3)' }}>Chat</span>
              </div>
              <span
                className="px-1.5 py-0.5 rounded-full text-xs"
                style={{ backgroundColor: 'var(--lc-surface-3)', color: 'var(--lc-muted)' }}
              >
                {messages.length}
              </span>
            </div>

            {/* Messages */}
            <div
              className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 min-h-0"
              style={{ backgroundColor: 'var(--lc-bg)' }}
            >
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 py-6">
                  <svg className="w-8 h-8" style={{ color: 'var(--lc-border)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-xs text-center" style={{ color: 'var(--lc-muted)' }}>
                    No messages yet.<br />Start the conversation!
                  </p>
                </div>
              ) : (
                messages.map(msg => (
                  <ChatMessage key={msg.id} msg={msg} isOwn={msg.userId === user?.id} />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Typing indicator */}
            {chatTypingUsers.length > 0 && (
              <div
                className="shrink-0 px-4 py-1.5 flex items-center gap-2 border-t"
                style={{ backgroundColor: 'var(--lc-surface)', borderColor: 'var(--lc-border)' }}
              >
                <TypingDots />
                <span className="text-xs" style={{ color: 'var(--lc-muted)' }}>
                  {chatTypingUsers.map(u => u.name).join(', ')} {chatTypingUsers.length === 1 ? 'is' : 'are'} typing…
                </span>
              </div>
            )}

            {/* Chat input */}
            <div
              className="shrink-0 px-3 py-3 border-t"
              style={{ backgroundColor: 'var(--lc-surface)', borderColor: 'var(--lc-border)' }}
            >
              <div className="flex gap-2">
                <input
                  ref={chatInputRef}
                  value={chatInput}
                  onChange={handleChatInput}
                  onKeyDown={handleChatKey}
                  onFocus={() => { chatFocusedRef.current = true; setUnreadCount(0) }}
                  onBlur={() => { chatFocusedRef.current = false }}
                  placeholder={connected ? 'Message… (Enter to send)' : 'Connecting…'}
                  className="lc-input flex-1 text-sm"
                  style={{ padding: '7px 12px' }}
                  disabled={!connected}
                />
                <button
                  onClick={sendMessage}
                  disabled={!connected || !chatInput.trim()}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    backgroundColor: connected && chatInput.trim() ? 'var(--lc-orange)' : 'var(--lc-surface-3)',
                    color: connected && chatInput.trim() ? '#1a1a1a' : 'var(--lc-muted)',
                    cursor: connected && chatInput.trim() ? 'pointer' : 'not-allowed',
                  }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Problem Picker Modal ─────────────────────────────────────────── */}
      {showPicker && canSelectProblem && (
        <ProblemPicker
          problems={problemList}
          loading={problemsLoading}
          onSelect={selectProblem}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  )
}
