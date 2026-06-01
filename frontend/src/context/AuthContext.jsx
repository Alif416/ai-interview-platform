import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/axios'

// 1. Create the context
const AuthContext = createContext(null)

// 2. Create the provider — wraps your entire app
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Check if user is already logged in on app startup
  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    const token = localStorage.getItem('token')

    if (storedUser && token) {
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    const { user, token } = data.data

    // Store in localStorage — persists across page refreshes
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    setUser(user)

    return user
  }

  const register = async (name, email, password, role) => {
    const { data } = await api.post('/auth/register', {
      name, email, password, role
    })
    const { user, token } = data.data

    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    setUser(user)

    return user
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  // Value available to ALL components inside AuthProvider
  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user  // converts user to boolean
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

// 3. Custom hook — clean way to use auth anywhere
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return context
}
