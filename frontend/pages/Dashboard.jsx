import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import SessionList from '../components/SessionList'
import AIInterview from './AIInterview'

function Dashboard() {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('sessions')

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-600">
            🤖 AI Interview Platform
          </h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('sessions')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                activeTab === 'sessions'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              Sessions
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                activeTab === 'ai'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              ✨ AI Practice
            </button>
            <div className="border-l pl-4 flex items-center gap-3">
              <span className="text-sm text-gray-600">
                {user?.name}
                <span className="ml-2 bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">
                  {user?.role}
                </span>
              </span>
              <button
                onClick={logout}
                className="text-sm text-red-500 hover:text-red-700 font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'sessions' && <SessionList />}
        {activeTab === 'ai' && <AIInterview />}
      </main>
    </div>
  )
}

export default Dashboard