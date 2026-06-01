import { useState } from 'react'
import api from '../api/axios'

function AIInterview() {
  const [config, setConfig] = useState({
    role: 'Software Engineer',
    level: 'L3',
    topic: 'Arrays and Hash Maps'
  })
  const [questions, setQuestions] = useState([])
  const [selectedQuestion, setSelectedQuestion] = useState(null)
  const [answer, setAnswer] = useState('')
  const [evaluation, setEvaluation] = useState(null)
  const [loading, setLoading] = useState(false)
  const [evaluating, setEvaluating] = useState(false)

  const generateQuestions = async () => {
    setLoading(true)
    setQuestions([])
    setSelectedQuestion(null)
    setEvaluation(null)

    try {
      const { data } = await api.post('/ai/questions', config)
      setQuestions(data.data.questions)
    } catch (err) {
      console.error('Failed to generate questions:', err)
    } finally {
      setLoading(false)
    }
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

  const getScoreColor = (score) => {
    if (score >= 8) return 'text-green-600'
    if (score >= 6) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">
        🤖 AI Interview Practice
      </h1>
      <p className="text-gray-500 mb-8">
        Generate real interview questions and get AI feedback on your answers
      </p>

      {/* Configuration */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Interview Setup</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <input
              value={config.role}
              onChange={(e) => setConfig({ ...config, role: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Level
            </label>
            <select
              value={config.level}
              onChange={(e) => setConfig({ ...config, level: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {['L3', 'L4', 'L5', 'L6', 'L7'].map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Topic
            </label>
            <input
              value={config.topic}
              onChange={(e) => setConfig({ ...config, topic: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>
        <button
          onClick={generateQuestions}
          disabled={loading}
          className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
        >
          {loading ? '🤔 Generating...' : '✨ Generate Questions'}
        </button>
      </div>

      {/* Questions List */}
      {questions.length > 0 && (
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">
            Generated Questions ({questions.length})
          </h2>
          <div className="space-y-3">
            {questions.map((q) => (
              <div
                key={q.id}
                onClick={() => {
                  setSelectedQuestion(q)
                  setAnswer('')
                  setEvaluation(null)
                }}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedQuestion?.id === q.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <p className="font-medium text-gray-800">{q.question}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Tests: {q.tests}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Answer Section */}
      {selectedQuestion && (
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-2">Your Answer</h2>
          <p className="text-gray-700 bg-gray-50 p-3 rounded-lg mb-4">
            {selectedQuestion.question}
          </p>

          {/* Key Points Hint */}
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-500 mb-2">
              💡 Key points to cover:
            </p>
            <ul className="list-disc list-inside space-y-1">
              {selectedQuestion.keyPoints.map((point, i) => (
                <li key={i} className="text-sm text-gray-600">{point}</li>
              ))}
            </ul>
          </div>

          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer here..."
            rows={6}
            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none mb-4"
          />

          <button
            onClick={evaluateAnswer}
            disabled={evaluating || !answer.trim()}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
          >
            {evaluating ? '🤔 Evaluating...' : '📊 Evaluate My Answer'}
          </button>
        </div>
      )}

      {/* Evaluation Results */}
      {evaluation && (
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">AI Feedback</h2>

          {/* Score */}
          <div className="flex items-center gap-4 mb-6">
            <div className="text-center">
              <p className={`text-5xl font-bold ${getScoreColor(evaluation.score)}`}>
                {evaluation.score}
              </p>
              <p className="text-gray-500 text-sm">out of 10</p>
            </div>
            <div>
              <p className="text-xl font-semibold">{evaluation.grade}</p>
              <p className="text-gray-500 text-sm">Overall Assessment</p>
            </div>
          </div>

          {/* Strengths */}
          <div className="mb-4">
            <h3 className="font-semibold text-green-700 mb-2">
              ✅ Strengths
            </h3>
            <ul className="space-y-1">
              {evaluation.strengths.map((s, i) => (
                <li key={i} className="text-sm text-gray-700 flex gap-2">
                  <span className="text-green-500">•</span> {s}
                </li>
              ))}
            </ul>
          </div>

          {/* Improvements */}
          <div className="mb-4">
            <h3 className="font-semibold text-orange-700 mb-2">
              📈 Areas to Improve
            </h3>
            <ul className="space-y-1">
              {evaluation.improvements.map((s, i) => (
                <li key={i} className="text-sm text-gray-700 flex gap-2">
                  <span className="text-orange-500">•</span> {s}
                </li>
              ))}
            </ul>
          </div>

          {/* Ideal Answer */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-blue-700 mb-2">
              💡 Ideal Answer
            </h3>
            <p className="text-sm text-gray-700">{evaluation.idealAnswer}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default AIInterview