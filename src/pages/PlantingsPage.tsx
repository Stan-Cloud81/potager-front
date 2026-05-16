import { useState, FormEvent } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPlantings, createPlanting, updatePlantingStatus } from '../api/plantings'
import { getPlants } from '../api/plants'
import { getPlots } from '../api/plots'
import { CreatePlantingRequest } from '../types'
import { Layout } from '../components/Layout'
import { PlantImage } from '../components/PlantImage'
import { formatDate } from '../utils/date'

export const PlantingsPage = () => {
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<CreatePlantingRequest>({
    plant_id: '',
    plot_id: '',
  })

  const queryClient = useQueryClient()

  const { data: plantings, isLoading, error } = useQuery({
    queryKey: ['plantings'],
    queryFn: () => getPlantings(),
  })

  const { data: plants } = useQuery({
    queryKey: ['plants'],
    queryFn: () => getPlants(),
  })

  const { data: plots } = useQuery({
    queryKey: ['plots'],
    queryFn: () => getPlots(),
  })

  const createMutation = useMutation({
    mutationFn: createPlanting,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plantings'] })
      setShowForm(false)
      setFormData({ plant_id: '', plot_id: '' })
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'planned' | 'planted' | 'harvested' }) =>
      updatePlantingStatus(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plantings'] })
    },
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    createMutation.mutate(formData)
  }

  const getPlantName = (plantId: string) => {
    return plants?.find(p => p.id === plantId)?.name || plantId
  }

  const getPlotName = (plotId: string) => {
    return plots?.find(p => p.id === plotId)?.name || plotId
  }

  return (
    <Layout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Plantings</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            {showForm ? 'Cancel' : 'Add Planting'}
          </button>
        </div>

        {showForm && (
          <div className="bg-white shadow-md rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Create New Planting</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plant
                </label>
                <select
                  required
                  value={formData.plant_id}
                  onChange={(e) => setFormData({ ...formData, plant_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Select a plant</option>
                  {plants?.map((plant) => (
                    <option key={plant.id} value={plant.id}>
                      {plant.name} ({plant.variety})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Garden Plot
                </label>
                <select
                  required
                  value={formData.plot_id}
                  onChange={(e) => setFormData({ ...formData, plot_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Select a plot</option>
                  {plots?.map((plot) => (
                    <option key={plot.id} value={plot.id}>
                      {plot.name}
                    </option>
                  ))}
                </select>
              </div>
              {createMutation.isError && (
                <div className="text-red-600 text-sm">
                  {createMutation.error.message}
                </div>
              )}
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Planting'}
              </button>
            </form>
          </div>
        )}

        {isLoading && (
          <div className="text-center py-12">
            <div className="text-gray-500">Loading plantings...</div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Error loading plantings: {error.message}</p>
          </div>
        )}

        {plantings && plantings.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No plantings found. Create one to get started!</p>
          </div>
        )}

        {plantings && plantings.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {plantings.map((planting) => (
              <div key={planting.id} className="bg-white shadow-md rounded-lg overflow-hidden">
                <PlantImage 
                  plantId={planting.plant_id}
                  alt={getPlantName(planting.plant_id)}
                  className="w-full h-40 object-contain bg-gray-50"
                />
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {getPlantName(planting.plant_id)}
                    </h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      planting.status === 'harvested' ? 'bg-blue-100 text-blue-800' :
                      planting.status === 'planted' ? 'bg-green-100 text-green-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {planting.status}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Plot:</span>
                      <span className="font-medium">{getPlotName(planting.plot_id)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Planted:</span>
                      <span className="font-medium">
                        {formatDate(planting.planted_at)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Expected Harvest:</span>
                      <span className="font-medium">
                        {formatDate(planting.expected_harvest)}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {planting.status === 'planned' && (
                      <button
                        onClick={() => updateStatusMutation.mutate({ id: planting.id, status: 'planted' })}
                        className="w-full bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm font-medium"
                      >
                        Mark as Planted
                      </button>
                    )}
                    {planting.status === 'planted' && (
                      <button
                        onClick={() => updateStatusMutation.mutate({ id: planting.id, status: 'harvested' })}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-medium"
                      >
                        Mark as Harvested
                      </button>
                    )}
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
