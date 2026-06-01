import { useState, useRef, useCallback } from 'react'
import Editor from '@monaco-editor/react'
import api from '../api/axios'

/* ── Monaco config ────────────────────────────────────────────────── */
const LANGUAGES = ['javascript', 'typescript', 'python', 'java', 'cpp', 'go', 'rust', 'sql', 'plaintext']

const LC_DARK_THEME = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment',  foreground: '6b7280', fontStyle: 'italic' },
    { token: 'keyword',  foreground: 'c084fc' },
    { token: 'string',   foreground: '86efac' },
    { token: 'number',   foreground: 'fca5a5' },
    { token: 'type',     foreground: '67e8f9' },
  ],
  colors: {
    'editor.background':                  '#1a1a1a',
    'editor.foreground':                  '#eff2f6',
    'editor.lineHighlightBackground':     '#282828',
    'editor.selectionBackground':         '#ffa11640',
    'editor.inactiveSelectionBackground': '#ffa11620',
    'editorLineNumber.foreground':        '#4a4a4a',
    'editorLineNumber.activeForeground':  '#ffa116',
    'editorCursor.foreground':            '#ffa116',
    'editorIndentGuide.background1':      '#3c3c3c',
    'editorWhitespace.foreground':        '#3c3c3c',
    'editorBracketMatch.background':      '#ffa11630',
    'editorBracketMatch.border':          '#ffa11680',
    'scrollbarSlider.background':         '#3c3c3c80',
    'scrollbarSlider.hoverBackground':    '#4a4a4a80',
    'minimap.background':                 '#1a1a1a',
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
  wordWrap: 'on',
  tabSize: 2,
  insertSpaces: true,
  automaticLayout: true,
  quickSuggestions: true,
  bracketPairColorization: { enabled: true },
  renderLineHighlight: 'line',
  smoothScrolling: true,
  cursorBlinking: 'smooth',
  cursorSmoothCaretAnimation: 'on',
}

/* ── helpers ──────────────────────────────────────────────────────── */
const LEVELS = ['L3', 'L4', 'L5', 'L6', 'L7']
const LEVEL_MAP = { L3: 'Junior', L4: 'Mid', L5: 'Senior', L6: 'Staff', L7: 'Principal' }
const DIFF_CLASS = { L3: 'lc-badge-easy', L4: 'lc-badge-blue', L5: 'lc-badge-medium', L6: 'lc-badge-medium', L7: 'lc-badge-hard' }

function DiffBadge({ level }) {
  return (
    <span className={`lc-badge ${DIFF_CLASS[level] || 'lc-badge-blue'}`}>
      {LEVEL_MAP[level] || level}
    </span>
  )
}

function ScoreCircle({ score }) {
  const r = 28
  const circ = 2 * Math.PI * r
  const pct  = score / 10
  const color = score >= 8 ? 'var(--lc-easy)' : score >= 6 ? 'var(--lc-medium)' : 'var(--lc-hard)'
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: 76, height: 76 }}>
      <svg width="76" height="76" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="38" cy="38" r={r} fill="none" stroke="var(--lc-border)" strokeWidth="5" />
        <circle cx="38" cy="38" r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={`${pct * circ} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.5s ease' }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-lg font-bold leading-none" style={{ color }}>{score}</div>
        <div className="text-xs leading-none mt-0.5" style={{ color: 'var(--lc-muted)' }}>/10</div>
      </div>
    </div>
  )
}

/* ── main component ───────────────────────────────────────────────── */
export default function AIInterview() {
  const [config, setConfig] = useState({ role: 'Software Engineer', level: 'L4', topic: 'Arrays and Hash Maps' })
  const [questions, setQuestions]     = useState([])
  const [selected, setSelected]       = useState(null)
  const [answer, setAnswer]           = useState('')
  const [evaluation, setEvaluation]   = useState(null)
  const [generating, setGenerating]   = useState(false)
  const [evaluating, setEvaluating]   = useState(false)
  const [leftTab, setLeftTab]         = useState('description')   // description | solutions
  const [rightTab, setRightTab]       = useState('answer')        // answer | results
  const [editorLanguage, setEditorLanguage] = useState('javascript')

  const editorRef  = useRef(null)
  const monacoRef  = useRef(null)

  const handleEditorMount = useCallback((editor, monaco) => {
    monaco.editor.defineTheme('lc-dark', LC_DARK_THEME)
    monaco.editor.setTheme('lc-dark')
    editorRef.current  = editor
    monacoRef.current  = monaco
  }, [])

  const generateQuestions = async () => {
    setGenerating(true)
    setQuestions([])
    setSelected(null)
    setEvaluation(null)
    try {
      const { data } = await api.post('/ai/questions', config)
      setQuestions(data.data.questions)
    } catch (e) { console.error(e) }
    finally { setGenerating(false) }
  }

  const pickQuestion = (q) => {
    setSelected(q)
    setAnswer('')
    setEvaluation(null)
    setLeftTab('description')
    setRightTab('answer')
    setEditorLanguage('javascript')
  }

  const submitAnswer = async () => {
    if (!selected || !answer.trim()) return
    setEvaluating(true)
    setEvaluation(null)
    try {
      const { data } = await api.post('/ai/evaluate', {
        question: selected.question,
        answer,
        role: config.role,
        level: config.level,
      })
      setEvaluation(data.data)
      setRightTab('results')
    } catch (e) { console.error(e) }
    finally { setEvaluating(false) }
  }

  const lineCount = answer ? answer.split('\n').length : 0

  /* ── No questions yet → setup screen ──────────────────────────── */
  if (!questions.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div
          className="w-full max-w-lg rounded-2xl border p-8"
          style={{ backgroundColor: 'var(--lc-surface)', borderColor: 'var(--lc-border)' }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'var(--lc-orange-dim)', border: '1px solid rgba(255,161,22,0.3)' }}
            >
              <svg className="w-5 h-5" style={{ color: 'var(--lc-orange)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h2 className="font-semibold text-base" style={{ color: 'var(--lc-text)' }}>AI Interview Practice</h2>
              <p className="text-xs" style={{ color: 'var(--lc-muted)' }}>Generate questions · Answer · Get instant feedback</p>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--lc-text-2)' }}>Role</label>
              <input
                value={config.role}
                onChange={e => setConfig({ ...config, role: e.target.value })}
                className="lc-input"
                placeholder="e.g. Software Engineer, Data Scientist"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: 'var(--lc-text-2)' }}>Level</label>
              <div className="flex gap-2 flex-wrap">
                {LEVELS.map(l => (
                  <button
                    key={l}
                    onClick={() => setConfig({ ...config, level: l })}
                    className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
                    style={{
                      backgroundColor: config.level === l ? 'var(--lc-orange-dim)' : 'transparent',
                      borderColor: config.level === l ? 'var(--lc-orange)' : 'var(--lc-border)',
                      color: config.level === l ? 'var(--lc-orange)' : 'var(--lc-text-3)',
                    }}
                  >
                    {l} · {LEVEL_MAP[l]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--lc-text-2)' }}>Topic</label>
              <input
                value={config.topic}
                onChange={e => setConfig({ ...config, topic: e.target.value })}
                className="lc-input"
                placeholder="e.g. System Design, Arrays, Dynamic Programming"
              />
            </div>
          </div>

          <button
            onClick={generateQuestions}
            disabled={generating}
            className="lc-btn-primary w-full justify-center"
            style={{ borderRadius: '8px', padding: '11px' }}
          >
            {generating ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                  <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75" />
                </svg>
                Generating questions...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generate Questions
              </>
            )}
          </button>
        </div>
      </div>
    )
  }

  /* ── Questions list → pick one ─────────────────────────────────── */
  if (!selected) {
    return (
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-semibold text-base" style={{ color: 'var(--lc-text)' }}>
              Select a Question
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--lc-muted)' }}>
              {config.role} · {config.level} · {config.topic}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <DiffBadge level={config.level} />
            <button
              onClick={() => setQuestions([])}
              className="lc-btn-ghost text-xs"
            >
              ← Reconfigure
            </button>
          </div>
        </div>

        {/* Table */}
        <div
          className="rounded-xl border overflow-hidden"
          style={{ backgroundColor: 'var(--lc-surface)', borderColor: 'var(--lc-border)' }}
        >
          {/* Table header */}
          <div
            className="grid text-xs font-medium px-5 py-2.5 border-b"
            style={{ gridTemplateColumns: '32px 1fr 90px', color: 'var(--lc-text-3)', borderColor: 'var(--lc-border)', backgroundColor: 'var(--lc-surface-2)' }}
          >
            <span>#</span>
            <span>Question</span>
            <span>Difficulty</span>
          </div>

          {questions.map((q, i) => (
            <button
              key={q.id}
              onClick={() => pickQuestion(q)}
              className="grid w-full text-left px-5 py-3.5 border-b text-sm transition-colors"
              style={{
                gridTemplateColumns: '32px 1fr 90px',
                borderColor: 'var(--lc-border)',
                backgroundColor: 'transparent',
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--lc-surface-2)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <span style={{ color: 'var(--lc-text-3)' }}>{i + 1}</span>
              <span className="font-medium pr-4" style={{ color: 'var(--lc-text)' }}>
                {q.question}
              </span>
              <span>
                <DiffBadge level={config.level} />
              </span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  /* ── Split-pane problem solver ─────────────────────────────────── */
  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 56px)' }}>

      {/* Top toolbar (LeetCode-style) */}
      <div
        className="flex items-center justify-between px-4 h-10 border-b shrink-0"
        style={{ backgroundColor: 'var(--lc-surface)', borderColor: 'var(--lc-border)' }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelected(null)}
            className="lc-btn-ghost text-xs px-2"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <span className="text-xs font-medium" style={{ color: 'var(--lc-text-2)' }}>
            {config.role} Interview
          </span>
          <DiffBadge level={config.level} />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={submitAnswer}
            disabled={evaluating || !answer.trim()}
            className="lc-btn-primary"
            style={{ padding: '5px 14px', fontSize: '12px' }}
          >
            {evaluating ? (
              <>
                <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                  <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75" />
                </svg>
                Evaluating
              </>
            ) : 'Submit'}
          </button>
        </div>
      </div>

      {/* Panels */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left panel: Description ─────────────────────────── */}
        <div
          className="w-5/12 flex flex-col border-r overflow-hidden"
          style={{ borderColor: 'var(--lc-border)' }}
        >
          {/* Tab bar */}
          <div
            className="flex border-b shrink-0"
            style={{ backgroundColor: 'var(--lc-surface)', borderColor: 'var(--lc-border)' }}
          >
            {[
              { id: 'description', label: 'Description' },
              { id: 'hints', label: 'Hints' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setLeftTab(t.id)}
                className="px-4 py-2.5 text-xs font-medium border-b-2 transition-colors"
                style={{
                  borderBottomColor: leftTab === t.id ? 'var(--lc-orange)' : 'transparent',
                  color: leftTab === t.id ? 'var(--lc-text)' : 'var(--lc-text-3)',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5">
            {leftTab === 'description' && (
              <div>
                <h3 className="text-base font-semibold mb-3" style={{ color: 'var(--lc-text)' }}>
                  {selected.question}
                </h3>

                <div
                  className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs mb-5"
                  style={{ backgroundColor: 'var(--lc-surface-3)', color: 'var(--lc-text-3)' }}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  Tests: {selected.tests}
                </div>

                <div
                  className="p-4 rounded-lg text-xs leading-relaxed"
                  style={{ backgroundColor: 'var(--lc-surface-2)', color: 'var(--lc-text-2)' }}
                >
                  <p className="font-medium mb-2" style={{ color: 'var(--lc-text)' }}>Context</p>
                  <p>
                    You are being interviewed for a <strong style={{ color: 'var(--lc-orange)' }}>{config.role}</strong> position
                    at the <strong style={{ color: 'var(--lc-orange)' }}>{LEVEL_MAP[config.level]}</strong> level.
                    Provide a thorough answer that demonstrates your depth of knowledge.
                  </p>
                </div>
              </div>
            )}

            {leftTab === 'hints' && (
              <div>
                <p className="text-xs font-medium mb-3" style={{ color: 'var(--lc-text-2)' }}>
                  Key points to cover in your answer:
                </p>
                <ul className="space-y-2">
                  {selected.keyPoints.map((pt, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span
                        className="shrink-0 mt-0.5 w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ backgroundColor: 'var(--lc-orange-dim)', color: 'var(--lc-orange)' }}
                      >
                        {i + 1}
                      </span>
                      <span className="text-xs leading-relaxed" style={{ color: 'var(--lc-text-2)' }}>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* ── Right panel: Answer / Results ───────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tab bar */}
          <div
            className="flex items-center justify-between border-b px-2 shrink-0"
            style={{ backgroundColor: 'var(--lc-surface)', borderColor: 'var(--lc-border)' }}
          >
            <div className="flex">
              {[
                { id: 'answer', label: 'Answer' },
                { id: 'results', label: 'Results', disabled: !evaluation },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => !t.disabled && setRightTab(t.id)}
                  className="px-4 py-2.5 text-xs font-medium border-b-2 transition-colors"
                  style={{
                    borderBottomColor: rightTab === t.id ? 'var(--lc-orange)' : 'transparent',
                    color: t.disabled ? 'var(--lc-border-2)' : rightTab === t.id ? 'var(--lc-text)' : 'var(--lc-text-3)',
                    cursor: t.disabled ? 'default' : 'pointer',
                  }}
                >
                  {t.label}
                  {t.id === 'results' && evaluation && (
                    <span
                      className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs"
                      style={{
                        backgroundColor: evaluation.score >= 8 ? 'var(--lc-easy-dim)' : evaluation.score >= 6 ? 'var(--lc-medium-dim)' : 'var(--lc-hard-dim)',
                        color: evaluation.score >= 8 ? 'var(--lc-easy)' : evaluation.score >= 6 ? 'var(--lc-medium)' : 'var(--lc-hard)',
                      }}
                    >
                      {evaluation.score}/10
                    </span>
                  )}
                </button>
              ))}
            </div>
            {rightTab === 'answer' && (
              <div className="flex items-center gap-2 pr-2">
                <div className="relative">
                  <select
                    value={editorLanguage}
                    onChange={e => {
                      const lang = e.target.value
                      setEditorLanguage(lang)
                      if (editorRef.current && monacoRef.current) {
                        monacoRef.current.editor.setModelLanguage(editorRef.current.getModel(), lang)
                      }
                    }}
                    className="lc-input text-xs pr-5 appearance-none cursor-pointer"
                    style={{ padding: '2px 18px 2px 7px', backgroundColor: 'var(--lc-surface-3)', minWidth: '100px' }}
                  >
                    {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                  <svg
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none"
                    style={{ color: 'var(--lc-text-3)' }}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <span className="text-xs" style={{ color: 'var(--lc-text-3)' }}>
                  {lineCount} {lineCount === 1 ? 'line' : 'lines'}
                </span>
              </div>
            )}
          </div>

          {/* Monaco Editor */}
          {rightTab === 'answer' && (
            <div className="flex-1 min-h-0 overflow-hidden">
              <Editor
                height="100%"
                language={editorLanguage}
                value={answer}
                onChange={val => setAnswer(val ?? '')}
                theme="lc-dark"
                options={EDITOR_OPTIONS}
                onMount={handleEditorMount}
                loading={
                  <div
                    className="flex items-center justify-center h-full"
                    style={{ backgroundColor: '#1a1a1a', color: '#4a4a4a' }}
                  >
                    <span className="text-sm">Loading editor…</span>
                  </div>
                }
              />
            </div>
          )}

          {/* Results panel */}
          {rightTab === 'results' && evaluation && (
            <div className="flex-1 overflow-y-auto p-5 space-y-4">

              {/* Score row */}
              <div
                className="flex items-center gap-5 p-4 rounded-xl border"
                style={{ backgroundColor: 'var(--lc-surface-2)', borderColor: 'var(--lc-border)' }}
              >
                <ScoreCircle score={evaluation.score} />
                <div>
                  <p className="font-semibold text-base mb-0.5" style={{ color: 'var(--lc-text)' }}>
                    {evaluation.grade}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--lc-muted)' }}>Overall assessment</p>
                  <div className="flex gap-1 mt-2">
                    {Array.from({ length: 10 }, (_, i) => (
                      <div
                        key={i}
                        className="w-3 h-1.5 rounded-sm"
                        style={{
                          backgroundColor: i < evaluation.score
                            ? evaluation.score >= 8 ? 'var(--lc-easy)' : evaluation.score >= 6 ? 'var(--lc-medium)' : 'var(--lc-hard)'
                            : 'var(--lc-border)',
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Accepted-style banner */}
              <div
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium"
                style={{
                  backgroundColor: evaluation.score >= 6 ? 'var(--lc-easy-dim)' : 'var(--lc-hard-dim)',
                  color: evaluation.score >= 6 ? 'var(--lc-easy)' : 'var(--lc-hard)',
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {evaluation.score >= 6
                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  }
                </svg>
                {evaluation.score >= 8 ? 'Accepted' : evaluation.score >= 6 ? 'Partially Accepted' : 'Wrong Answer — keep practicing'}
              </div>

              {/* Strengths */}
              <div>
                <p className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: 'var(--lc-easy)' }}>
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Strengths
                </p>
                <ul className="space-y-1.5">
                  {evaluation.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs" style={{ color: 'var(--lc-text-2)' }}>
                      <span style={{ color: 'var(--lc-easy)' }} className="shrink-0 leading-4">+</span>{s}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Improvements */}
              <div>
                <p className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: 'var(--lc-medium)' }}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  Areas to Improve
                </p>
                <ul className="space-y-1.5">
                  {evaluation.improvements.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs" style={{ color: 'var(--lc-text-2)' }}>
                      <span style={{ color: 'var(--lc-medium)' }} className="shrink-0 leading-4">›</span>{s}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Model answer */}
              <div>
                <p className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: 'var(--lc-blue)' }}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Model Answer
                </p>
                <div
                  className="text-xs leading-relaxed p-3.5 rounded-lg"
                  style={{ backgroundColor: 'var(--lc-surface-2)', color: 'var(--lc-text-2)', border: '1px solid var(--lc-border)' }}
                >
                  {evaluation.idealAnswer}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
