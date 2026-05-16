import { LoginRequest, LoginResponse, RegisterRequest } from "../types"
import { apiRequest } from "./client"

export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  return apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export const register = async (data: RegisterRequest) => {
  return apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export const getMe = async (): Promise<{ email: string, is_admin?: boolean }> => {
  return apiRequest<{ email: string, is_admin?: boolean }>("/auth/me")
}

export const refreshToken = async (refreshToken: string): Promise<LoginResponse> => {
  return apiRequest<LoginResponse>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
}
