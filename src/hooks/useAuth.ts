import { useState, useEffect } from 'react'
import { getAuthToken, setAuthToken, setRefreshToken, clearAllTokens } from '../api/client'

export const useAuth = () => {
  const [token, setToken] = useState<string | null>(getAuthToken())

  const saveToken = (newToken: string, newRefreshToken: string) => {
    setAuthToken(newToken)
    setRefreshToken(newRefreshToken)
    setToken(newToken)
  }

  const logout = () => {
    clearAllTokens()
    setToken(null)
  }

  useEffect(() => {
    setToken(getAuthToken())
  }, [])

  return { token, saveToken, logout }
}
