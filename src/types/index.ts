export type PlantDetails = {
  culture?: Record<string, unknown>
  caracteristiques?: Record<string, unknown>
  origin?: Record<string, unknown>
  utilisation?: Record<string, unknown>
}

export type Plant = {
  id: string
  url?: string
  category?: string
  famille_plante?: string
  titre_plante?: string
  url_image_principale?: string
  images_galerie?: string[]
  images_attributs?: string[]
  description_html?: string
  sections_description?: Array<{ type: string; content: string }>
  nom_scientifique?: string
  plantes_associes?: string[]
  distance_par_plante?: number
  distance_par_rangee?: number
  details?: PlantDetails
  name?: string
  type?: "vegetable" | "fruit"
  variety?: string
  planting_months?: number[]
  harvested_months?: number[]
  harvest_time_days?: number
  watering_frequency?: "low" | "medium" | "high"
  sunlight_requirement?: "low" | "partial" | "full"
  spacing_between_plants?: number
  spacing_between_rows?: number
  days_to_maturity_text?: string
  germination_temperature?: string
  growing_method?: string
  hybrid_status?: string
  image?: string
  latin_name?: string
  soil_ph?: string
}

export type GardenPlot = {
  id: string
  nom: string
  name: string
  largeur: number
  longueur: number
  nature_du_sol: "bruyère" | "argileux" | "terreau" | "calcaire" | "littoral" | "caillouteux" | "humifère"
  exposition: "plein soleil" | "ensoleillée" | "mi-ombre" | "ombre"
}

export type Planting = {
  id: string
  plant_id: string
  plot_id: string
  planted_at: string
  expected_harvest: string
  status: "planned" | "planted" | "harvested"
  quantity: number
  position_x?: number
  position_y?: number
  individual_positions?: { x: number; y: number }[]
  variety?: string
  width_factor?: number
  length_factor?: number
  rotation?: number
}

export type LoginRequest = {
  email: string
  password: string
}

export type LoginResponse = {
  token: string
  refresh_token: string
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
  position_x?: number
  position_y?: number
  individual_positions?: { x: number; y: number }[]
  rotation?: number
  width_factor?: number
  length_factor?: number
}

export type UpdatePlantingRequest = {
  status?: "planned" | "planted" | "harvested"
  quantity?: number
  position_x?: number
  position_y?: number
  individual_positions?: { x: number; y: number }[]
  rotation?: number
  width_factor?: number
  length_factor?: number
}

export type UpdatePlantingStatusRequest = {
  status: "planned" | "planted" | "harvested"
}

export type UpdatePlantingQuantityRequest = {
  quantity: number
}

export type UpdatePlantingPositionRequest = {
  position_x: number
  position_y: number
  individual_positions?: { x: number; y: number }[]
  rotation?: number
}

export type UpdatePlantingSizeRequest = {
  width_factor: number
  length_factor: number
}

export type UpdatePlantRequest = {
  category?: string
  description_html?: string
  details?: PlantDetails
  distance_par_plante?: number
  distance_par_rangee?: number
  famille_plante?: string
  images_attributs?: string[]
  images_galerie?: string[]
  nom_scientifique?: string
  plantes_associes?: string[]
  sections_description?: Array<{ type: string; content: string }>
  titre_plante?: string
  url?: string
  url_image_principale?: string
}
