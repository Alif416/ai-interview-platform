// Props are like function arguments
// They let parent components pass data to children

function SessionCard({ title, role, level, status, candidateName }) {

  // Helper function to color-code status
  const getStatusColor = (status) => {
    const colors = {
      SCHEDULED: 'bg-blue-100 text-blue-800',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
          {status}
        </span>
      </div>

      <div className="space-y-2 text-sm text-gray-600">
        <p><span className="font-medium">Role:</span> {role}</p>
        <p><span className="font-medium">Level:</span> {level}</p>
        <p><span className="font-medium">Candidate:</span> {candidateName}</p>
      </div>
    </div>
  )
}

export default SessionCard