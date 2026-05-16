import { useState, FormEvent } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPlants, getPlantDetails } from '../api/plants'
import { getPlots } from '../api/plots'
import { createPlanting } from '../api/plantings'
import { Layout } from '../components/Layout'
import { PlantImage } from '../components/PlantImage'
import { MonthIndicator } from '../components/MonthIndicator'

export const PlantsPage = () => {
  const queryClient = useQueryClient()
  const [showPlantDetails, setShowPlantDetails] = useState(false)
  const [selectedPlantForDetails, setSelectedPlantForDetails] = useState<string | null>(null)
  const [showAddToPlot, setShowAddToPlot] = useState(false)
  const [selectedPlantForPlot, setSelectedPlantForPlot] = useState<string | null>(null)
  const [selectedPlotId, setSelectedPlotId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    type: '',
    planting_months: 0,
    harvested_months: 0,
    watering_frequency: '',
    sunlight_requirement: '',
    spacing_between_plants_min: 0,
    spacing_between_plants_max: 100,
    spacing_between_rows_min: 0,
    spacing_between_rows_max: 100,
  })

  const getSpacingFilter = (min: number, max: number) => {
    if (min === 0 && max === 100) return undefined
    if (min === 0) return max.toString()
    return `${min},${max}`
  }

  const activeFilters = {
    search: searchQuery || undefined,
    type: filters.type || undefined,
    planting_months: filters.planting_months || undefined,
    harvested_months: filters.harvested_months || undefined,
    watering_frequency: filters.watering_frequency || undefined,
    sunlight_requirement: filters.sunlight_requirement || undefined,
    spacing_between_plants: getSpacingFilter(filters.spacing_between_plants_min, filters.spacing_between_plants_max),
    spacing_between_rows: getSpacingFilter(filters.spacing_between_rows_min, filters.spacing_between_rows_max),
  }

  const { data: plants, isLoading, error } = useQuery({
    queryKey: ['plants', activeFilters],
    queryFn: () => getPlants(activeFilters),
  })

  const { data: plantDetails } = useQuery({
    queryKey: ['plantDetails', selectedPlantForDetails],
    queryFn: () => getPlantDetails(selectedPlantForDetails!),
    enabled: !!selectedPlantForDetails,
  })

  const { data: plots } = useQuery({
    queryKey: ['plots'],
    queryFn: () => getPlots(),
  })

  const createMutation = useMutation({
    mutationFn: createPlanting,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plantings'] })
      setShowAddToPlot(false)
      setSelectedPlantForPlot(null)
      setSelectedPlotId('')
      setQuantity(1)
    },
  })

  const handleAddToPlot = (e: FormEvent) => {
    e.preventDefault()
    if (!selectedPlantForPlot || !selectedPlotId) return
    createMutation.mutate({ plant_id: selectedPlantForPlot, plot_id: selectedPlotId, quantity })
  }

  return (
    <Layout>
      <div>
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Plants</h1>
            <div className="flex gap-4 items-center flex-1 max-w-2xl ml-8">
              <input
                type="text"
                placeholder="Search plants by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">All</option>
                    <option value="vegetable">Vegetable</option>
                    <option value="fruit">Fruit</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Planting Month</label>
                  <select
                    value={filters.planting_months}
                    onChange={(e) => setFilters({ ...filters, planting_months: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="0">All</option>
                    {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((month, i) => (
                      <option key={i + 1} value={i + 1}>{month}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Harvest Month</label>
                  <select
                    value={filters.harvested_months}
                    onChange={(e) => setFilters({ ...filters, harvested_months: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="0">All</option>
                    {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((month, i) => (
                      <option key={i + 1} value={i + 1}>{month}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Watering Frequency</label>
                  <select
                    value={filters.watering_frequency}
                    onChange={(e) => setFilters({ ...filters, watering_frequency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">All</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sunlight Requirement</label>
                  <select
                    value={filters.sunlight_requirement}
                    onChange={(e) => setFilters({ ...filters, sunlight_requirement: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">All</option>
                    <option value="low">Low</option>
                    <option value="partial">Partial</option>
                    <option value="full">Full</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Spacing Between Plants: {filters.spacing_between_plants_min}cm - {filters.spacing_between_plants_max}cm
                  </label>
                  <div className="relative h-8 flex items-center">
                    <div className="absolute w-full h-2 bg-gray-200 rounded"></div>
                    <div 
                      className="absolute h-2 bg-green-600 rounded"
                      style={{
                        left: `${filters.spacing_between_plants_min}%`,
                        right: `${100 - filters.spacing_between_plants_max}%`
                      }}
                    ></div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={filters.spacing_between_plants_min}
                      onChange={(e) => {
                        const val = parseInt(e.target.value)
                        if (val <= filters.spacing_between_plants_max) {
                          setFilters({ ...filters, spacing_between_plants_min: val })
                        }
                      }}
                      className="absolute w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-green-700 [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-green-700 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                    />
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={filters.spacing_between_plants_max}
                      onChange={(e) => {
                        const val = parseInt(e.target.value)
                        if (val >= filters.spacing_between_plants_min) {
                          setFilters({ ...filters, spacing_between_plants_max: val })
                        }
                      }}
                      className="absolute w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-green-700 [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-green-700 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Spacing Between Rows: {filters.spacing_between_rows_min}cm - {filters.spacing_between_rows_max}cm
                  </label>
                  <div className="relative h-8 flex items-center">
                    <div className="absolute w-full h-2 bg-gray-200 rounded"></div>
                    <div 
                      className="absolute h-2 bg-green-600 rounded"
                      style={{
                        left: `${filters.spacing_between_rows_min}%`,
                        right: `${100 - filters.spacing_between_rows_max}%`
                      }}
                    ></div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={filters.spacing_between_rows_min}
                      onChange={(e) => {
                        const val = parseInt(e.target.value)
                        if (val <= filters.spacing_between_rows_max) {
                          setFilters({ ...filters, spacing_between_rows_min: val })
                        }
                      }}
                      className="absolute w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-green-700 [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-green-700 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                    />
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={filters.spacing_between_rows_max}
                      onChange={(e) => {
                        const val = parseInt(e.target.value)
                        if (val >= filters.spacing_between_rows_min) {
                          setFilters({ ...filters, spacing_between_rows_max: val })
                        }
                      }}
                      className="absolute w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-green-700 [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-green-700 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={() => setFilters({
                  type: '',
                  planting_months: 0,
                  harvested_months: 0,
                  watering_frequency: '',
                  sunlight_requirement: '',
                  spacing_between_plants_min: 0,
                  spacing_between_plants_max: 100,
                  spacing_between_rows_min: 0,
                  spacing_between_rows_max: 100,
                })}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md text-sm font-medium"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>

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
                    {plant.name} - {plant.variety}
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
                  <button
                    onClick={() => {
                      setSelectedPlantForPlot(plant.id)
                      setShowAddToPlot(true)
                    }}
                    className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Add to Plot
                  </button>
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

        {showAddToPlot && selectedPlantForPlot && (() => {
          const plant = plants?.find(p => p.id === selectedPlantForPlot)
          if (!plant) return null
          
          return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-900">Add {plant.name} to Plot</h2>
                    <button
                      onClick={() => {
                        setShowAddToPlot(false)
                        setSelectedPlantForPlot(null)
                        setSelectedPlotId('')
                        setQuantity(1)
                      }}
                      className="text-gray-400 hover:text-gray-600 text-2xl"
                    >
                      ×
                    </button>
                  </div>
                  <form onSubmit={handleAddToPlot} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select Plot
                      </label>
                      <select
                        required
                        value={selectedPlotId}
                        onChange={(e) => setSelectedPlotId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="">Choose a plot...</option>
                        {plots?.map((plot) => (
                          <option key={plot.id} value={plot.id}>
                            {plot.name}
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

                    {createMutation.isError && (
                      <div className="text-red-600 text-sm">
                        {createMutation.error.message}
                      </div>
                    )}
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddToPlot(false)
                          setSelectedPlantForPlot(null)
                          setSelectedPlotId('')
                          setQuantity(1)
                        }}
                        className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={createMutation.isPending || !selectedPlotId}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50"
                      >
                        {createMutation.isPending ? 'Adding...' : 'Add Plant'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )
        })()}
      </div>
    </Layout>
  )
}
