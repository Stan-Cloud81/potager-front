import { GardenPlot, CreateGardenPlotRequest } from "../types"
import { apiRequest } from "./client"

export const getPlots = async (filters?: {
  nom?: string
  nature_du_sol?: string
  exposition?: string
}): Promise<GardenPlot[]> => {
  const params = new URLSearchParams()
  if (filters?.nom) params.append("nom", filters.nom)
  if (filters?.nature_du_sol) params.append("nature_du_sol", filters.nature_du_sol)
  if (filters?.exposition) params.append("exposition", filters.exposition)
  
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
