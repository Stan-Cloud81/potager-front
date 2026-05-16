const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1"

export const getAuthToken = (): string | null => {
  return localStorage.getItem("token")
}

export const setAuthToken = (token: string): void => {
  localStorage.setItem("token", token)
}

export const clearAuthToken = (): void => {
  localStorage.removeItem("token")
}

export const getRefreshToken = (): string | null => {
  return localStorage.getItem("refresh_token")
}

export const setRefreshToken = (token: string): void => {
  localStorage.setItem("refresh_token", token)
}

export const clearRefreshToken = (): void => {
  localStorage.removeItem("refresh_token")
}

export const clearAllTokens = (): void => {
  clearAuthToken()
  clearRefreshToken()
}

let isRefreshing = false
let refreshPromise: Promise<void> | null = null

export const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const makeRequest = async (token: string | null): Promise<Response> => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    if (options.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        if (typeof value === 'string') {
          headers[key] = value
        }
      })
    }

    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    return fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    })
  }

  const attemptRefresh = async (): Promise<void> => {
    if (isRefreshing) {
      await refreshPromise
      return
    }

    isRefreshing = true
    refreshPromise = (async () => {
      try {
        const refreshTokenValue = getRefreshToken()
        if (!refreshTokenValue) {
          clearAllTokens()
          window.location.href = "/login"
          throw new Error("No refresh token available")
        }

        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshTokenValue }),
        })

        if (!response.ok) {
          clearAllTokens()
          window.location.href = "/login"
          throw new Error("Refresh token expired")
        }

        const data = await response.json()
        setAuthToken(data.token)
        setRefreshToken(data.refresh_token)
      } finally {
        isRefreshing = false
        refreshPromise = null
      }
    })()

    await refreshPromise
  }

  const token = getAuthToken()
  let response = await makeRequest(token)

  if (response.status === 401 && endpoint !== "/auth/refresh") {
    await attemptRefresh()
    const newToken = getAuthToken()
    response = await makeRequest(newToken)
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }))
    throw new Error(error.message || `HTTP ${response.status}`)
  }

  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return undefined as T
  }

  return response.json()
}
