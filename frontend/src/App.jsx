import { useState } from 'react'
import SessionList from './components/SessionList'
import Counter from './components/Counter'

function App() {
  const [activeTab, setActiveTab] = useState('sessions')

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-600">
            🤖 AI Interview Platform
          </h1>
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('sessions')}
              className={`px-4 py-2 rounded ${
                activeTab === 'sessions'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:text-blue-500'
              }`}
            >
              Sessions
            </button>
            <button
              onClick={() => setActiveTab('counter')}
              className={`px-4 py-2 rounded ${
                activeTab === 'counter'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:text-blue-500'
              }`}
            >
              State Demo
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'sessions' && <SessionList />}
        {activeTab === 'counter' && <Counter />}
      </main>
    </div>
  )
}

export default App