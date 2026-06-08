import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // On startup, restore user profile from localStorage (token lives in httpOnly cookie)
  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser)
        if (parsed && typeof parsed === 'object') setUser(parsed)
        else localStorage.removeItem('user')
      } catch {
        localStorage.removeItem('user')
      }
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    const { user } = data.data

    // Token is set as httpOnly cookie by the server — we only store user profile
    if (user) localStorage.setItem('user', JSON.stringify(user))
    setUser(user)

    return user
  }

  const register = async (name, username, email, password, role) => {
    const { data } = await api.post('/auth/register', {
      name, username, email, password, role
    })
    return data
  }

  const logout = async () => {
    try {
      // Ask server to clear the httpOnly cookie
      await api.post('/auth/logout')
    } catch {
      // Continue with client-side cleanup even if server call fails
    }
    localStorage.removeItem('user')
    setUser(null)
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return context
}
