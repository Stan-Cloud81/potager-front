import { getAuthToken } from '../api/client'

const API_BASE_URL = "http://127.0.0.1:8080/api/v1"

export const getPlantImageUrl = (plantId: string): string => {
  const token = getAuthToken()
  if (!token) {
    return ''
  }
  return `${API_BASE_URL}/plants/${plantId}/image?token=${token}`
}
