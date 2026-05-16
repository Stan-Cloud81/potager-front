import { Planting, CreatePlantingRequest, UpdatePlantingStatusRequest } from "../types"
import { apiRequest } from "./client"

export const getPlantings = async (filters?: {
  plant_id?: string
  plot_id?: string
  status?: string
}): Promise<Planting[]> => {
  const params = new URLSearchParams()
  if (filters?.plant_id) params.append("plant_id", filters.plant_id)
  if (filters?.plot_id) params.append("plot_id", filters.plot_id)
  if (filters?.status) params.append("status", filters.status)
  
  const query = params.toString()
  return apiRequest<Planting[]>(`/plantings${query ? `?${query}` : ""}`)
}

export const getPlanting = async (id: string): Promise<Planting> => {
  return apiRequest<Planting>(`/plantings/${id}`)
}

export const createPlanting = async (data: CreatePlantingRequest): Promise<Planting> => {
  return apiRequest<Planting>("/plantings", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export const updatePlantingStatus = async (
  id: string,
  data: UpdatePlantingStatusRequest
): Promise<Planting> => {
  return apiRequest<Planting>(`/plantings/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  })
}
