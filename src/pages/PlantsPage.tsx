import { useQuery } from '@tanstack/react-query'
import { getPlants } from '../api/plants'
import { Layout } from '../components/Layout'
import { PlantImage } from '../components/PlantImage'

export const PlantsPage = () => {
  const { data: plants, isLoading, error } = useQuery({
    queryKey: ['plants'],
    queryFn: () => getPlants(),
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
                <PlantImage 
                  plantId={plant.id}
                  alt={plant.name}
                  className="w-full h-40 object-contain bg-gray-50"
                />
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {plant.name}
                  </h3>
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
                      <span className="text-gray-600">Planting Months:</span>
                      <span className="font-medium">{plant.planting_months.join(', ')}</span>
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
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
