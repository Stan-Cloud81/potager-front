import { Plant, CreatePlantRequest } from "../types"
import { apiRequest } from "./client"

export const getPlants = async (filters?: {
  search?: string
  type?: string
  variety?: string
  planting_months?: number
  harvested_months?: number
  watering_frequency?: string
  sunlight_requirement?: string
  spacing_between_plants?: string
  spacing_between_rows?: string
  page?: number
  limit?: number
}): Promise<{ plants: Plant[], total: number, page: number, limit: number }> => {
  const params = new URLSearchParams()
  if (filters?.search) params.append("search", filters.search)
  if (filters?.type) params.append("type", filters.type)
  if (filters?.variety) params.append("variety", filters.variety)
  if (filters?.planting_months) params.append("planting_months", filters.planting_months.toString())
  if (filters?.harvested_months) params.append("harvested_months", filters.harvested_months.toString())
  if (filters?.watering_frequency) params.append("watering_frequency", filters.watering_frequency)
  if (filters?.sunlight_requirement) params.append("sunlight_requirement", filters.sunlight_requirement)
  if (filters?.spacing_between_plants) params.append("spacing_between_plants", filters.spacing_between_plants)
  if (filters?.spacing_between_rows) params.append("spacing_between_rows", filters.spacing_between_rows)
  if (filters?.page) params.append("page", filters.page.toString())
  if (filters?.limit) params.append("limit", filters.limit.toString())
  
  const query = params.toString()
  return apiRequest<{ plants: Plant[], total: number, page: number, limit: number }>(`/plants${query ? `?${query}` : ""}`)
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
