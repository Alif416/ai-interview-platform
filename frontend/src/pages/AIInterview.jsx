import { useState } from 'react'
import api from '../api/axios'

const LEVELS = ['L3', 'L4', 'L5', 'L6', 'L7']

const LEVEL_LABELS = {
  L3: { label: 'Junior', color: '#00b8a3' },
  L4: { label: 'Mid', color: '#60a5fa' },
  L5: { label: 'Senior', color: '#ffc01e' },
  L6: { label: 'Staff', color: '#ffa116' },
  L7: { label: 'Principal', color: '#ef4743' },
}

function ScoreRing({ score }) {
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const filled = (score / 10) * circumference
  const color = score >= 8 ? '#00b8a3' : score >= 6 ? '#ffc01e' : '#ef4743'

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="100" height="100" className="-rotate-90">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--lc-border)" strokeWidth="7" />
        <circle
          cx="50" cy="50" r={radius} fill="none"
          stroke={color} strokeWidth="7"
          strokeDasharray={`${filled} ${circumference}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
      </svg>
      <div className="absolute text-center">
        <span className="text-2xl font-bold" style={{ color }}>{score}</span>
        <span className="block text-xs" style={{ color: 'var(--lc-muted)' }}>/10</span>
      </div>
    </div>
  )
}

function AIInterview() {
  const [config, setConfig] = useState({
    role: 'Software Engineer',
    level: 'L4',
    topic: 'Arrays and Hash Maps'
  })
  const [questions, setQuestions] = useState([])
  const [selectedQuestion, setSelectedQuestion] = useState(null)
  const [answer, setAnswer] = useState('')
  const [evaluation, setEvaluation] = useState(null)
  const [loading, setLoading] = useState(false)
  const [evaluating, setEvaluating] = useState(false)
  const [step, setStep] = useState(1)

  const generateQuestions = async () => {
    setLoading(true)
    setQuestions([])
    setSelectedQuestion(null)
    setEvaluation(null)
    try {
      const { data } = await api.post('/ai/questions', config)
      setQuestions(data.data.questions)
      setStep(2)
    } catch (err) {
      console.error('Failed to generate questions:', err)
    } finally {
      setLoading(false)
    }
  }

  const selectQuestion = (q) => {
    setSelectedQuestion(q)
    setAnswer('')
    setEvaluation(null)
    setStep(3)
  }

  const evaluateAnswer = async () => {
    if (!selectedQuestion || !answer.trim()) return
    setEvaluating(true)
    setEvaluation(null)
    try {
      const { data } = await api.post('/ai/evaluate', {
        question: selectedQuestion.question,
        answer,
        role: config.role,
        level: config.level
      })
      setEvaluation(data.data)
    } catch (err) {
      console.error('Failed to evaluate:', err)
    } finally {
      setEvaluating(false)
    }
  }

  const inputStyle = {
    backgroundColor: 'var(--lc-bg)',
    border: '1px solid var(--lc-border)',
    color: 'var(--lc-text)',
  }

  const levelInfo = LEVEL_LABELS[config.level] || {}

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--lc-text)' }}>
          AI Interview Practice
        </h1>
        <p className="text-sm" style={{ color: 'var(--lc-muted)' }}>
          Generate real interview questions and get instant AI feedback on your answers
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 mb-8">
        {[
          { n: 1, label: 'Configure' },
          { n: 2, label: 'Choose Question' },
          { n: 3, label: 'Answer & Review' },
        ].map(({ n, label }, idx, arr) => (
          <div key={n} className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                style={{
                  backgroundColor: step >= n ? 'var(--lc-orange)' : 'var(--lc-surface2)',
                  color: step >= n ? '#000' : 'var(--lc-muted)',
                }}
              >
                {step > n ? (
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : n}
              </div>
              <span className="text-sm hidden sm:block" style={{ color: step >= n ? 'var(--lc-text)' : 'var(--lc-muted)' }}>
                {label}
              </span>
            </div>
            {idx < arr.length - 1 && (
              <div
                className="w-8 h-px mx-1"
                style={{ backgroundColor: step > n ? 'var(--lc-orange)' : 'var(--lc-border)' }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Configuration */}
      <div
        className="rounded-xl border p-6 mb-5"
        style={{ backgroundColor: 'var(--lc-surface)', borderColor: 'var(--lc-border)' }}
      >
        <div className="flex items-center gap-2 mb-5">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ backgroundColor: 'var(--lc-orange)', color: '#000' }}
          >1</div>
          <h2 className="text-base font-semibold" style={{ color: 'var(--lc-text)' }}>
            Interview Setup
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          <div>
            <label className="block text-xs font-medium mb-1.5 uppercase tracking-wide" style={{ color: 'var(--lc-muted)' }}>
              Role
            </label>
            <input
              value={config.role}
              onChange={(e) => setConfig({ ...config, role: e.target.value })}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none transition-all"
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = 'var(--lc-orange)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--lc-border)'}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5 uppercase tracking-wide" style={{ color: 'var(--lc-muted)' }}>
              Level
            </label>
            <div className="flex gap-1.5 flex-wrap">
              {LEVELS.map(l => (
                <button
                  key={l}
                  onClick={() => setConfig({ ...config, level: l })}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    backgroundColor: config.level === l ? 'rgba(255,161,22,0.15)' : 'var(--lc-bg)',
                    border: `1px solid ${config.level === l ? 'var(--lc-orange)' : 'var(--lc-border)'}`,
                    color: config.level === l ? 'var(--lc-orange)' : 'var(--lc-muted)',
                  }}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5 uppercase tracking-wide" style={{ color: 'var(--lc-muted)' }}>
              Topic
            </label>
            <input
              value={config.topic}
              onChange={(e) => setConfig({ ...config, topic: e.target.value })}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none transition-all"
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = 'var(--lc-orange)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--lc-border)'}
            />
          </div>
        </div>

        <button
          onClick={generateQuestions}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
          style={{
            backgroundColor: loading ? 'var(--lc-surface2)' : 'var(--lc-orange)',
            color: loading ? 'var(--lc-muted)' : '#000',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Generating...
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

      {/* Step 2: Questions */}
      {questions.length > 0 && (
        <div
          className="rounded-xl border p-6 mb-5"
          style={{ backgroundColor: 'var(--lc-surface)', borderColor: 'var(--lc-border)' }}
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ backgroundColor: step >= 2 ? 'var(--lc-orange)' : 'var(--lc-surface2)', color: '#000' }}
              >2</div>
              <h2 className="text-base font-semibold" style={{ color: 'var(--lc-text)' }}>
                Select a Question
              </h2>
            </div>
            <span
              className="text-xs px-2.5 py-1 rounded-full"
              style={{ backgroundColor: 'var(--lc-bg)', color: 'var(--lc-muted)', border: '1px solid var(--lc-border)' }}
            >
              {questions.length} questions
            </span>
          </div>

          <div className="space-y-2.5">
            {questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => selectQuestion(q)}
                className="w-full text-left p-4 rounded-lg border transition-all group"
                style={{
                  backgroundColor: selectedQuestion?.id === q.id ? 'rgba(255,161,22,0.08)' : 'var(--lc-bg)',
                  borderColor: selectedQuestion?.id === q.id ? 'var(--lc-orange)' : 'var(--lc-border)',
                }}
                onMouseEnter={(e) => {
                  if (selectedQuestion?.id !== q.id) {
                    e.currentTarget.style.borderColor = 'var(--lc-border-light)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedQuestion?.id !== q.id) {
                    e.currentTarget.style.borderColor = 'var(--lc-border)'
                  }
                }}
              >
                <div className="flex items-start gap-3">
                  <span
                    className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
                    style={{
                      backgroundColor: selectedQuestion?.id === q.id ? 'var(--lc-orange)' : 'var(--lc-surface2)',
                      color: selectedQuestion?.id === q.id ? '#000' : 'var(--lc-muted)',
                    }}
                  >
                    {idx + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium mb-1" style={{ color: 'var(--lc-text)' }}>
                      {q.question}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--lc-muted)' }}>
                      Tests: {q.tests}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Answer */}
      {selectedQuestion && (
        <div
          className="rounded-xl border p-6 mb-5"
          style={{ backgroundColor: 'var(--lc-surface)', borderColor: 'var(--lc-border)' }}
        >
          <div className="flex items-center gap-2 mb-5">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ backgroundColor: 'var(--lc-orange)', color: '#000' }}
            >3</div>
            <h2 className="text-base font-semibold" style={{ color: 'var(--lc-text)' }}>
              Your Answer
            </h2>
          </div>

          {/* Question banner */}
          <div
            className="rounded-lg p-4 mb-4 text-sm"
            style={{ backgroundColor: 'var(--lc-bg)', border: '1px solid var(--lc-border)', color: 'var(--lc-text)' }}
          >
            {selectedQuestion.question}
          </div>

          {/* Key points */}
          <div
            className="rounded-lg p-3.5 mb-4"
            style={{ backgroundColor: 'rgba(255,161,22,0.07)', border: '1px solid rgba(255,161,22,0.2)' }}
          >
            <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: 'var(--lc-orange)' }}>
              Key points to cover
            </p>
            <ul className="space-y-1">
              {selectedQuestion.keyPoints.map((point, i) => (
                <li key={i} className="flex items-start gap-2 text-xs" style={{ color: 'var(--lc-text-dim)' }}>
                  <span style={{ color: 'var(--lc-orange)' }} className="mt-0.5 shrink-0">›</span>
                  {point}
                </li>
              ))}
            </ul>
          </div>

          {/* Answer textarea */}
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Write your answer here. Be specific and thorough..."
            rows={7}
            className="w-full rounded-lg px-4 py-3 text-sm outline-none transition-all resize-none mb-4 font-mono"
            style={{
              ...inputStyle,
              lineHeight: '1.7',
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--lc-orange)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--lc-border)'}
          />

          <div className="flex items-center gap-3">
            <button
              onClick={evaluateAnswer}
              disabled={evaluating || !answer.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
              style={{
                backgroundColor: evaluating || !answer.trim() ? 'var(--lc-surface2)' : 'var(--lc-success)',
                color: evaluating || !answer.trim() ? 'var(--lc-muted)' : '#fff',
                cursor: evaluating || !answer.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              {evaluating ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Evaluating...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Evaluate Answer
                </>
              )}
            </button>
            <span className="text-xs" style={{ color: 'var(--lc-muted)' }}>
              {answer.trim().split(/\s+/).filter(Boolean).length} words
            </span>
          </div>
        </div>
      )}

      {/* Evaluation Results */}
      {evaluation && (
        <div
          className="rounded-xl border p-6"
          style={{ backgroundColor: 'var(--lc-surface)', borderColor: 'var(--lc-border)' }}
        >
          <h2 className="text-base font-semibold mb-5 flex items-center gap-2" style={{ color: 'var(--lc-text)' }}>
            <svg className="w-5 h-5" style={{ color: 'var(--lc-orange)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            AI Feedback
          </h2>

          {/* Score + Grade */}
          <div
            className="flex items-center gap-6 p-5 rounded-xl mb-5"
            style={{ backgroundColor: 'var(--lc-bg)', border: '1px solid var(--lc-border)' }}
          >
            <ScoreRing score={evaluation.score} />
            <div>
              <p className="text-xl font-bold mb-0.5" style={{ color: 'var(--lc-text)' }}>
                {evaluation.grade}
              </p>
              <p className="text-sm" style={{ color: 'var(--lc-muted)' }}>
                Overall Assessment
              </p>
              <div className="flex gap-2 mt-2">
                {[...Array(10)].map((_, i) => (
                  <div
                    key={i}
                    className="w-2.5 h-2.5 rounded-sm"
                    style={{
                      backgroundColor: i < evaluation.score
                        ? (evaluation.score >= 8 ? 'var(--lc-success)' : evaluation.score >= 6 ? 'var(--lc-yellow)' : 'var(--lc-error)')
                        : 'var(--lc-border)',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {/* Strengths */}
            <div
              className="rounded-lg p-4"
              style={{ backgroundColor: 'var(--lc-success-dim)', border: '1px solid rgba(0,184,163,0.3)' }}
            >
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--lc-success)' }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Strengths
              </h3>
              <ul className="space-y-2">
                {evaluation.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--lc-text-dim)' }}>
                    <span style={{ color: 'var(--lc-success)' }} className="shrink-0 mt-0.5">+</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            {/* Improvements */}
            <div
              className="rounded-lg p-4"
              style={{ backgroundColor: 'var(--lc-yellow-dim)', border: '1px solid rgba(255,192,30,0.3)' }}
            >
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--lc-yellow)' }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Areas to Improve
              </h3>
              <ul className="space-y-2">
                {evaluation.improvements.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--lc-text-dim)' }}>
                    <span style={{ color: 'var(--lc-yellow)' }} className="shrink-0 mt-0.5">›</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Ideal Answer */}
          <div
            className="rounded-lg p-4"
            style={{ backgroundColor: 'var(--lc-blue-dim)', border: '1px solid rgba(96,165,250,0.3)' }}
          >
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--lc-blue)' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Ideal Answer
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--lc-text-dim)' }}>
              {evaluation.idealAnswer}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default AIInterview
