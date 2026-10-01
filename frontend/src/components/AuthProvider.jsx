import { useCallback, useEffect, useMemo, useState } from 'react'
import { api, getToken, setToken, setUnauthorizedHandler } from '../api.js'
import { AuthContext } from '../auth-context.js'

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // Only wait for /me when there is a stored token to check
  const [loading, setLoading] = useState(() => Boolean(getToken()))

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(logout)
    if (!getToken()) return
    api
      .me()
      .then((data) => setUser(data.user))
      .catch(() => logout())
      .finally(() => setLoading(false))
  }, [logout])

  const value = useMemo(() => {
    const signIn = (data) => {
      setToken(data.token)
      setUser(data.user)
      return data.user
    }
    return {
      user,
      loading,
      login: (username, password) => api.login(username, password).then(signIn),
      register: (username, password) => api.register(username, password).then(signIn),
      logout,
    }
  }, [user, loading, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
