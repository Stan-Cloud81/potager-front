import { Plant, CreatePlantRequest } from "../types"
import { apiRequest } from "./client"

export const getPlants = async (filters?: {
  name?: string
  type?: string
  variety?: string
}): Promise<Plant[]> => {
  const params = new URLSearchParams()
  if (filters?.name) params.append("name", filters.name)
  if (filters?.type) params.append("type", filters.type)
  if (filters?.variety) params.append("variety", filters.variety)
  
  const query = params.toString()
  return apiRequest<Plant[]>(`/plants${query ? `?${query}` : ""}`)
}

export const getPlant = async (id: string): Promise<Plant> => {
  return apiRequest<Plant>(`/plants/${id}`)
}

export const getPlantDetails = async (id: string): Promise<any> => {
  return apiRequest<any>(`/plants/${id}/details`)
}

export const createPlant = async (data: CreatePlantRequest): Promise<Plant> => {
  return apiRequest<Plant>("/plants", {
    method: "POST",
    body: JSON.stringify(data),
  })
}
