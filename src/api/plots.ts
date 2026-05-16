import { GardenPlot, CreateGardenPlotRequest } from "../types"
import { apiRequest } from "./client"

export const getPlots = async (filters?: {
  name?: string
  soil_type?: string
  sunlight_exposure?: string
}): Promise<GardenPlot[]> => {
  const params = new URLSearchParams()
  if (filters?.name) params.append("name", filters.name)
  if (filters?.soil_type) params.append("soil_type", filters.soil_type)
  if (filters?.sunlight_exposure) params.append("sunlight_exposure", filters.sunlight_exposure)
  
  const query = params.toString()
  return apiRequest<GardenPlot[]>(`/plots${query ? `?${query}` : ""}`)
}

export const getPlot = async (id: string): Promise<GardenPlot> => {
  return apiRequest<GardenPlot>(`/plots/${id}`)
}

export const createPlot = async (data: CreateGardenPlotRequest): Promise<GardenPlot> => {
  return apiRequest<GardenPlot>("/plots", {
    method: "POST",
    body: JSON.stringify(data),
  })
}
