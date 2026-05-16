import { useState, useEffect } from 'react'
import { getAuthToken, setAuthToken, clearAuthToken } from '../api/client'

export const useAuth = () => {
  const [token, setToken] = useState<string | null>(getAuthToken())

  const saveToken = (newToken: string) => {
    setAuthToken(newToken)
    setToken(newToken)
  }

  const logout = () => {
    clearAuthToken()
    setToken(null)
  }

  useEffect(() => {
    setToken(getAuthToken())
  }, [])

  return { token, saveToken, logout }
}
