import { Planting, CreatePlantingRequest, UpdatePlantingStatusRequest, UpdatePlantingQuantityRequest, UpdatePlantingPositionRequest } from "../types"
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

export const updatePlantingQuantity = async (
  id: string,
  data: UpdatePlantingQuantityRequest
): Promise<Planting> => {
  return apiRequest<Planting>(`/plantings/${id}/quantity`, {
    method: "PATCH",
    body: JSON.stringify(data),
  })
}

export const deletePlanting = async (id: string): Promise<void> => {
  return apiRequest<void>(`/plantings/${id}`, {
    method: "DELETE",
  })
}

export const updatePlantingPosition = async (
  plantingId: string,
  data: UpdatePlantingPositionRequest
): Promise<void> => {
  return apiRequest<void>(`/plantings/${plantingId}/position`, {
    method: "PATCH",
    body: JSON.stringify(data),
  })
}
