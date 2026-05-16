export type Plant = {
  id: string
  name: string
  type: "vegetable" | "fruit"
  variety: string
  planting_months: number[]
  harvested_months: number[]
  harvest_time_days: number
  watering_frequency: "low" | "medium" | "high"
  sunlight_requirement: "low" | "partial" | "full"
  spacing_between_plants: number
  spacing_between_rows: number
}

export type GardenPlot = {
  id: string
  name: string
  width: number
  length: number
  soil_type: "clay" | "sandy" | "loamy"
  sunlight_exposure: "low" | "partial" | "full"
}

export type Planting = {
  id: string
  plant_id: string
  plot_id: string
  planted_at: string
  expected_harvest: string
  status: "planned" | "planted" | "harvested"
  quantity: number
}

export type LoginRequest = {
  email: string
  password: string
}

export type LoginResponse = {
  token: string
  user_id: string
  email: string
}

export type RegisterRequest = {
  email: string
  password: string
}

export type CreatePlantRequest = Omit<Plant, "id">

export type CreateGardenPlotRequest = Omit<GardenPlot, "id">

export type CreatePlantingRequest = {
  plant_id: string
  plot_id: string
  quantity: number
}

export type UpdatePlantingStatusRequest = {
  status: "planned" | "planted" | "harvested"
}

export type UpdatePlantingQuantityRequest = {
  quantity: number
}

export type PlantPosition = {
  planting_id: string
  x: number
  y: number
}

export type IndividualPlantPosition = {
  planting_id: string
  index: number
  x: number
  y: number
}
