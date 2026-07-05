import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  headers: {
    'Content-Type': 'application/json'
  },
  // Required so the browser sends the httpOnly cookie with every request
  withCredentials: true
})

// REQUEST interceptor — attach token from localStorage as Bearer header
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Endpoints where a 401 is a normal "bad credentials / not logged in" result,
// NOT an expired session. These must be allowed to reject so the calling page
// can show its own error message instead of triggering a redirect.
const AUTH_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password']

// RESPONSE interceptor — auto-redirect only when an authenticated session expires
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || ''
    const isAuthRequest = AUTH_ENDPOINTS.some((endpoint) => url.includes(endpoint))
    const onLoginPage = window.location.pathname === '/login'

    // Only force a redirect for a 401 on a *protected* request (expired/invalid
    // token) — never for the login attempt itself, and never if already on /login.
    if (error.response?.status === 401 && !isAuthRequest && !onLoginPage) {
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
