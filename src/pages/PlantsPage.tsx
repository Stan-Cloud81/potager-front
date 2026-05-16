import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getPlants, getPlantDetails } from '../api/plants'
import { Layout } from '../components/Layout'
import { PlantImage } from '../components/PlantImage'
import { MonthIndicator } from '../components/MonthIndicator'

export const PlantsPage = () => {
  const [showPlantDetails, setShowPlantDetails] = useState(false)
  const [selectedPlantForDetails, setSelectedPlantForDetails] = useState<string | null>(null)

  const { data: plants, isLoading, error } = useQuery({
    queryKey: ['plants'],
    queryFn: () => getPlants(),
  })

  const { data: plantDetails } = useQuery({
    queryKey: ['plantDetails', selectedPlantForDetails],
    queryFn: () => getPlantDetails(selectedPlantForDetails!),
    enabled: !!selectedPlantForDetails,
  })

  return (
    <Layout>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Plants</h1>

        {isLoading && (
          <div className="text-center py-12">
            <div className="text-gray-500">Loading plants...</div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Error loading plants: {error.message}</p>
          </div>
        )}

        {plants && plants.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No plants found</p>
          </div>
        )}

        {plants && plants.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {plants.map((plant) => (
              <div key={plant.id} className="bg-white shadow-md rounded-lg overflow-hidden">
                <div className="relative">
                  <PlantImage 
                    plantId={plant.id}
                    alt={plant.name}
                    className="w-full h-40 object-contain bg-gray-50"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedPlantForDetails(plant.id)
                      setShowPlantDetails(true)
                    }}
                    className="absolute top-2 left-2 bg-white hover:bg-gray-100 text-gray-700 rounded-full p-2 shadow-md"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    {plant.name}
                  </h3>
                  <div className="space-y-3 mb-4">
                    <MonthIndicator label="Seedling" months={plant.planting_months} color="green" />
                    <MonthIndicator label="Harvest" months={plant.harvested_months} color="red" />
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium capitalize">{plant.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Variety:</span>
                      <span className="font-medium">{plant.variety}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Harvest Time:</span>
                      <span className="font-medium">{plant.harvest_time_days} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Watering:</span>
                      <span className="font-medium capitalize">{plant.watering_frequency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sunlight:</span>
                      <span className="font-medium capitalize">{plant.sunlight_requirement}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Spacing:</span>
                      <span className="font-medium">{plant.spacing_between_plants}cm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Row Spacing:</span>
                      <span className="font-medium">{plant.spacing_between_rows}cm</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showPlantDetails && plantDetails && selectedPlantForDetails && (() => {
          const plant = plants?.find(p => p.id === selectedPlantForDetails)
          if (!plant) return null
          
          return (
            <div 
              className="fixed inset-0 flex items-center justify-center p-4 z-50"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
              onClick={() => {
                setShowPlantDetails(false)
                setSelectedPlantForDetails(null)
              }}
            >
              <div 
                className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-4 items-start flex-1">
                      <PlantImage 
                        plantId={plant.id}
                        alt={plant.name}
                        className="w-24 h-24 object-contain bg-gray-50 rounded-lg"
                      />
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">{plant.name}</h2>
                        <p className="text-gray-600">{plant.variety}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowPlantDetails(false)
                        setSelectedPlantForDetails(null)
                      }}
                      className="text-gray-400 hover:text-gray-600 text-2xl"
                    >
                      ×
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div className="border-b pb-4">
                      <div className="text-sm font-semibold text-gray-600 uppercase mb-3">
                        Planting Schedule
                      </div>
                      <div className="space-y-3">
                        <MonthIndicator label="Seedling" months={plant.planting_months} color="green" />
                        <MonthIndicator label="Harvest" months={plant.harvested_months} color="red" />
                      </div>
                    </div>
                    <div className="border-b pb-2">
                      <div className="text-sm font-semibold text-gray-600 uppercase mb-1">
                        Plant Information
                      </div>
                      <div className="text-gray-900 space-y-2">
                        {Object.entries(plant)
                          .filter(([key]) => key !== 'id' && key !== 'planting_months' && key !== 'harvested_months')
                          .map(([key, value]) => {
                            const getIcon = (key: string) => {
                              if (key.includes('type')) return '🏷️'
                              if (key.includes('variety')) return '🌿'
                              if (key.includes('harvest')) return '⏱️'
                              if (key.includes('watering')) return '💧'
                              if (key.includes('sunlight')) return '☀️'
                              if (key.includes('spacing')) return '📏'
                              return '•'
                            }
                            
                            return (
                              <div key={key}>
                                <span className="font-medium">{getIcon(key)} {key.replace(/_/g, ' ')}: </span>
                                {Array.isArray(value) ? value.join(', ') : String(value)}
                              </div>
                            )
                          })}
                      </div>
                    </div>
                    {Array.isArray(plantDetails) && plantDetails.length > 0 && (
                      <div className="border-b pb-2">
                        <div className="text-sm font-semibold text-gray-600 uppercase mb-1">
                          Details
                        </div>
                        <div 
                          className="text-gray-900" 
                          dangerouslySetInnerHTML={{ __html: plantDetails.join('<br>') }} 
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })()}
      </div>
    </Layout>
  )
}
