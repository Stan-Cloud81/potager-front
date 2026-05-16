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
