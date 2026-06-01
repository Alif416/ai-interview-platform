import { useAuth } from '../context/AuthContext'
import SessionList from '../components/SessionList'

function Dashboard() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-600">
            🤖 AI Interview Platform
          </h1>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              <span className="font-medium">{user?.name}</span>
              <span className="ml-2 bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">
                {user?.role}
              </span>
            </div>
            <button
              onClick={logout}
              className="text-sm text-red-500 hover:text-red-700 font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Welcome Banner */}
      <div className="bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold">
            Welcome back, {user?.name}! 👋
          </h2>
          <p className="text-blue-100 mt-1">
            {user?.role === 'INTERVIEWER'
              ? 'Manage your interview sessions below.'
              : 'View your upcoming interviews below.'}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <SessionList />
      </main>
    </div>
  )
}

export default Dashboard