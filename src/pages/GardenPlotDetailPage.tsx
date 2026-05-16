import { useState, FormEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPlot } from '../api/plots'
import { getPlantings, createPlanting, updatePlantingStatus, updatePlantingQuantity, deletePlanting } from '../api/plantings'
import { getPlants, getPlantDetails } from '../api/plants'
import { Layout } from '../components/Layout'
import { PlantImage } from '../components/PlantImage'
import { MonthIndicator } from '../components/MonthIndicator'
import { formatDate } from '../utils/date'

export const GardenPlotDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [selectedPlantId, setSelectedPlantId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [showPlantDetails, setShowPlantDetails] = useState(false)
  const [selectedPlantForDetails, setSelectedPlantForDetails] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [plantingToDelete, setPlantingToDelete] = useState<string | null>(null)

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

  const { data: plantDetails } = useQuery({
    queryKey: ['plantDetails', selectedPlantForDetails],
    queryFn: () => getPlantDetails(selectedPlantForDetails!),
    enabled: !!selectedPlantForDetails,
  })

  const createMutation = useMutation({
    mutationFn: createPlanting,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plantings'] })
      setShowForm(false)
      setSelectedPlantId('')
      setQuantity(1)
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'planned' | 'planted' | 'harvested' }) =>
      updatePlantingStatus(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plantings'] })
    },
  })

  const updateQuantityMutation = useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) =>
      updatePlantingQuantity(id, { quantity }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plantings'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deletePlanting,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plantings'] })
      setShowDeleteConfirm(false)
      setPlantingToDelete(null)
    },
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!selectedPlantId || !id) return
    createMutation.mutate({ plant_id: selectedPlantId, plot_id: id, quantity })
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

  const getPreviousStatus = (currentStatus: string): 'planned' | 'planted' | null => {
    if (currentStatus === 'planted') return 'planned'
    if (currentStatus === 'harvested') return 'planted'
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
            const previousStatus = getPreviousStatus(planting.status)
            
            if (!plant) return null

            return (
              <div
                key={planting.id}
                className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow"
              >
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
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900">
                        {plant.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (planting.quantity > 1) {
                              updateQuantityMutation.mutate({ id: planting.id, quantity: planting.quantity - 1 })
                            } else {
                              setPlantingToDelete(planting.id)
                              setShowDeleteConfirm(true)
                            }
                          }}
                          className={`${
                            planting.quantity === 1 
                              ? 'bg-red-200 hover:bg-red-300 text-red-700' 
                              : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                          } rounded px-2 py-0.5 text-xs font-medium`}
                        >
                          {planting.quantity === 1 ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          ) : (
                            '-'
                          )}
                        </button>
                        <span className="text-sm font-medium text-gray-700">Qty: {planting.quantity}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            updateQuantityMutation.mutate({ id: planting.id, quantity: planting.quantity + 1 })
                          }}
                          className="bg-gray-200 hover:bg-gray-300 text-gray-700 rounded px-2 py-0.5 text-xs font-medium"
                        >
                          +
                        </button>
                      </div>
                    </div>
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
                    <div className="flex justify-between">
                      <span className="text-gray-600">📏 Spacing:</span>
                      <span className="font-medium">{plant.spacing_between_plants}cm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">📏 Row Spacing:</span>
                      <span className="font-medium">{plant.spacing_between_rows}cm</span>
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

                  <div className="mt-4 flex gap-2">
                    {previousStatus && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          updateStatusMutation.mutate({ id: planting.id, status: previousStatus })
                        }}
                        className="w-24 bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-2 rounded-md text-sm font-medium truncate"
                      >
                        ← {previousStatus}
                      </button>
                    )}
                    {nextStatus && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          updateStatusMutation.mutate({ id: planting.id, status: nextStatus })
                        }}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-sm font-medium truncate"
                      >
                        {nextStatus} →
                      </button>
                    )}
                  </div>
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                    />
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
                            <div className="flex justify-between">
                              <span>Spacing:</span>
                              <span className="font-medium">{plant.spacing_between_plants}cm</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Row spacing:</span>
                              <span className="font-medium">{plant.spacing_between_rows}cm</span>
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

        {showDeleteConfirm && plantingToDelete && (
          <div 
            className="fixed inset-0 flex items-center justify-center p-4 z-50"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
            onClick={() => {
              setShowDeleteConfirm(false)
              setPlantingToDelete(null)
            }}
          >
            <div 
              className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4">Delete Planting?</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this planting? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setPlantingToDelete(null)
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (plantingToDelete) {
                      deleteMutation.mutate(plantingToDelete)
                    }
                  }}
                  disabled={deleteMutation.isPending}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50"
                >
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
