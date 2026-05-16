import { useState, FormEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPlot } from '../api/plots'
import { getPlantings, createPlanting, updatePlantingStatus } from '../api/plantings'
import { getPlants } from '../api/plants'
import { Layout } from '../components/Layout'
import { formatDate } from '../utils/date'

export const GardenPlotDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [selectedPlantId, setSelectedPlantId] = useState('')

  const { data: plot, isLoading: plotLoading } = useQuery({
    queryKey: ['plot', id],
    queryFn: () => getPlot(id!),
    enabled: !!id,
  })

  const { data: allPlantings } = useQuery({
    queryKey: ['plantings'],
    queryFn: () => getPlantings(),
  })

  const { data: plants } = useQuery({
    queryKey: ['plants'],
    queryFn: () => getPlants(),
  })

  const createMutation = useMutation({
    mutationFn: createPlanting,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plantings'] })
      setShowForm(false)
      setSelectedPlantId('')
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
    if (!selectedPlantId || !id) return
    createMutation.mutate({ plant_id: selectedPlantId, plot_id: id })
  }

  const plotPlantings = allPlantings?.filter(p => p.plot_id === id) || []

  const getPlantInfo = (plantId: string) => {
    return plants?.find(p => p.id === plantId)
  }

  const getNextStatus = (currentStatus: string): 'planted' | 'harvested' | null => {
    if (currentStatus === 'planned') return 'planted'
    if (currentStatus === 'planted') return 'harvested'
    return null
  }

  if (plotLoading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="text-gray-500">Loading plot details...</div>
        </div>
      </Layout>
    )
  }

  if (!plot) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="text-red-600">Plot not found</div>
          <button
            onClick={() => navigate('/plots')}
            className="mt-4 text-green-600 hover:text-green-700"
          >
            Back to Plots
          </button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div>
        <div className="mb-6">
          <button
            onClick={() => navigate('/plots')}
            className="text-green-600 hover:text-green-700 mb-4 flex items-center gap-2"
          >
            ← Back to Plots
          </button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{plot.name}</h1>
              <p className="text-gray-600 mt-1">
                {plot.width}m × {plot.length}m ({(plot.width * plot.length).toFixed(1)} m²) • 
                {' '}{plot.soil_type} soil • {plot.sunlight_exposure} sun
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {plotPlantings.map((planting) => {
            const plant = getPlantInfo(planting.plant_id)
            const nextStatus = getNextStatus(planting.status)
            
            if (!plant) return null

            return (
              <div
                key={planting.id}
                className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow cursor-pointer"
                onClick={() => {
                  if (nextStatus) {
                    updateStatusMutation.mutate({ id: planting.id, status: nextStatus })
                  }
                }}
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-bold text-gray-900">
                      {plant.name}
                    </h3>
                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                      planting.status === 'harvested' ? 'bg-blue-100 text-blue-800' :
                      planting.status === 'planted' ? 'bg-green-100 text-green-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {planting.status.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Variety:</span>
                      <span className="font-medium">{plant.variety}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium capitalize">{plant.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">💧 Watering:</span>
                      <span className="font-medium capitalize">{plant.watering_frequency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">☀️ Sunlight:</span>
                      <span className="font-medium capitalize">{plant.sunlight_requirement}</span>
                    </div>
                  </div>

                  <div className="border-t pt-3 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Planted:</span>
                      <span className="font-medium">
                        {formatDate(planting.planted_at)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Harvest:</span>
                      <span className="font-medium">
                        {formatDate(planting.expected_harvest)}
                      </span>
                    </div>
                  </div>

                  {nextStatus && (
                    <div className="mt-4 text-center text-xs text-gray-500">
                      Click to mark as {nextStatus}
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          <div 
            onClick={() => setShowForm(true)}
            className="bg-white shadow-lg rounded-xl overflow-hidden border-2 border-dashed border-green-300 hover:border-green-500 hover:shadow-xl transition-all cursor-pointer flex items-center justify-center min-h-[320px]"
          >
            <div className="text-center p-6">
              <div className="text-6xl text-green-500 mb-2">+</div>
              <p className="text-lg font-medium text-gray-700">Add Plant</p>
            </div>
          </div>
        </div>

        {plotPlantings.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No plants in this plot yet. Click the + box to add one!
          </div>
        )}

        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Add Plant to {plot.name}</h2>
                  <button
                    onClick={() => setShowForm(false)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Plant
                    </label>
                    <select
                      required
                      value={selectedPlantId}
                      onChange={(e) => setSelectedPlantId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="">Choose a plant...</option>
                      {plants?.map((plant) => (
                        <option key={plant.id} value={plant.id}>
                          {plant.name} - {plant.variety} ({plant.type})
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedPlantId && plants && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold mb-2">Plant Details</h3>
                      {(() => {
                        const plant = plants.find(p => p.id === selectedPlantId)
                        if (!plant) return null
                        return (
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Watering:</span>
                              <span className="font-medium capitalize">{plant.watering_frequency}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Sunlight:</span>
                              <span className="font-medium capitalize">{plant.sunlight_requirement}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Harvest time:</span>
                              <span className="font-medium">{plant.harvest_time_days} days</span>
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  )}

                  {createMutation.isError && (
                    <div className="text-red-600 text-sm">
                      {createMutation.error.message}
                    </div>
                  )}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createMutation.isPending || !selectedPlantId}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50"
                    >
                      {createMutation.isPending ? 'Adding...' : 'Add Plant'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
