import { createContext, useContext } from 'react'

// { user, loading, login, register, logout }; provided by components/AuthProvider.jsx
export const AuthContext = createContext(null)

export const useAuth = () => useContext(AuthContext)
