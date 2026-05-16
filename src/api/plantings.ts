import { Planting, CreatePlantingRequest, UpdatePlantingStatusRequest } from "../types"
import { apiRequest } from "./client"

export const getPlantings = async (): Promise<Planting[]> => {
  return apiRequest<Planting[]>("/plantings")
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
