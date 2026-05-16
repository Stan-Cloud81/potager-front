import { Planting, CreatePlantingRequest, UpdatePlantingRequest, UpdatePlantingStatusRequest, UpdatePlantingQuantityRequest, UpdatePlantingPositionRequest, UpdatePlantingSizeRequest } from "../types"
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

export const updatePlanting = async (
  id: string,
  data: UpdatePlantingRequest
): Promise<Planting> => {
  return apiRequest<Planting>(`/plantings/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  })
}

export const updatePlantingStatus = async (
  id: string,
  data: UpdatePlantingStatusRequest
): Promise<Planting> => {
  return updatePlanting(id, data)
}

export const updatePlantingQuantity = async (
  id: string,
  data: UpdatePlantingQuantityRequest
): Promise<Planting> => {
  return updatePlanting(id, data)
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
  await updatePlanting(plantingId, data)
}

export const updatePlantingSize = async (
  plantingId: string,
  data: UpdatePlantingSizeRequest
): Promise<void> => {
  await updatePlanting(plantingId, data)
}
