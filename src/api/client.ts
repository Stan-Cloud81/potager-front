const API_BASE_URL = "http://127.0.0.1:8080/api/v1"

export const getAuthToken = (): string | null => {
  return localStorage.getItem("token")
}

export const setAuthToken = (token: string): void => {
  localStorage.setItem("token", token)
}

export const clearAuthToken = (): void => {
  localStorage.removeItem("token")
}

export const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getAuthToken()
  
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

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }))
    throw new Error(error.message || `HTTP ${response.status}`)
  }

  return response.json()
}
