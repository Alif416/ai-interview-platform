import { useState, useEffect } from 'react'
import SessionCard from './SessionCard'

// useEffect runs code AFTER the component renders
// Perfect for API calls, subscriptions, timers

function SessionList() {
  const [sessions, setSessions] = useState([])      // stores fetched data
  const [loading, setLoading] = useState(true)      // loading state
  const [error, setError] = useState(null)          // error state

  // useEffect(callback, dependencies)
  // Empty [] = run once after first render (like componentDidMount)
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true)
        const response = await fetch('http://localhost:3000/api/v1/sessions')
        const data = await response.json()

        if (data.success) {
          setSessions(data.data.sessions)
        } else {
          setError('Failed to fetch sessions')
        }
      } catch (err) {
        setError('Cannot connect to server')
      } finally {
        setLoading(false)  // always runs, success or fail
      }
    }

    fetchSessions()
  }, []) // [] = only run once on mount

  // Conditional rendering based on state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        ⚠️ {error}
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No sessions found. Create your first interview session!
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Interview Sessions ({sessions.length})
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sessions.map(session => (
          <SessionCard
            key={session.id}
            title={session.title}
            role={session.role}
            level={session.level}
            status={session.status}
            candidateName={session.candidate.name}
          />
        ))}
      </div>
    </div>
  )
}

export default SessionList