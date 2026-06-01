import { useState } from 'react'

// useState returns [currentValue, functionToUpdateValue]
// When state changes → React re-renders the component automatically

function Counter() {
  const [count, setCount] = useState(0)  // initial value = 0
  const [name, setName] = useState('')

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Understanding State</h2>

      {/* Count State */}
      <div className="mb-6">
        <p className="text-2xl font-bold text-center mb-3">{count}</p>
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => setCount(count - 1)}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            -
          </button>
          <button
            onClick={() => setCount(0)}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Reset
          </button>
          <button
            onClick={() => setCount(count + 1)}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            +
          </button>
        </div>
      </div>

      {/* Input State */}
      <div>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Type your name..."
          className="w-full border rounded px-3 py-2 mb-2"
        />
        {name && (
          <p className="text-gray-600">Hello, <strong>{name}</strong>!</p>
        )}
      </div>
    </div>
  )
}

export default Counter