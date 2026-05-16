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
  const [page, setPage] = useState(1)
  const [limit] = useState(50)
  const [showTypeDropdown, setShowTypeDropdown] = useState(false)
  const [showWateringDropdown, setShowWateringDropdown] = useState(false)
  const [showSunlightDropdown, setShowSunlightDropdown] = useState(false)
  const [filters, setFilters] = useState({
    type: [] as string[],
    planting_months: [] as number[],
    harvested_months: [] as number[],
    watering_frequency: [] as string[],
    sunlight_requirement: [] as string[],
    spacing_between_plants_min: 0,
    spacing_between_plants_max: 100,
    spacing_between_rows_min: 0,
    spacing_between_rows_max: 100,
  })

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setPage(1)
  }

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters)
    setPage(1)
  }

  const getSpacingFilter = (min: number, max: number) => {
    if (min === 0 && max === 100) return undefined
    if (min === 0) return max.toString()
    return `${min},${max}`
  }

  const activeFilters = {
    search: searchQuery || undefined,
    type: filters.type.length > 0 ? filters.type.join(',') : undefined,
    planting_months: filters.planting_months.length > 0 ? filters.planting_months.join(',') : undefined,
    harvested_months: filters.harvested_months.length > 0 ? filters.harvested_months.join(',') : undefined,
    watering_frequency: filters.watering_frequency.length > 0 ? filters.watering_frequency.join(',') : undefined,
    sunlight_requirement: filters.sunlight_requirement.length > 0 ? filters.sunlight_requirement.join(',') : undefined,
    spacing_between_plants: getSpacingFilter(filters.spacing_between_plants_min, filters.spacing_between_plants_max),
    spacing_between_rows: getSpacingFilter(filters.spacing_between_rows_min, filters.spacing_between_rows_max),
    page,
    limit,
  }

  const { data: plantsData, isLoading, error } = useQuery({
    queryKey: ['plants', activeFilters],
    queryFn: () => getPlants(activeFilters),
  })

  const plants = plantsData?.plants
  const totalPlants = plantsData?.total ?? 0
  const totalPages = Math.ceil(totalPlants / limit)

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
          <div className="flex items-center gap-3 mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Plants</h1>
            {!isLoading && <span className="text-lg text-gray-600">({totalPlants})</span>}
          </div>
          <div className="flex gap-4 items-center">
            <input
              type="text"
              placeholder="Search plants by name..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>

          {showFilters && (
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <button
                    type="button"
                    onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 text-left bg-white relative"
                  >
                    <span className="block pr-8">{filters.type.length === 0 ? 'All' : filters.type.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(', ')}</span>
                    <svg className="w-4 h-4 text-gray-500 absolute right-2 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showTypeDropdown && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg">
                      {['vegetable', 'fruit'].map((type) => (
                        <label key={type} className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filters.type.includes(type)}
                            onChange={(e) => {
                              const newTypes = e.target.checked
                                ? [...filters.type, type]
                                : filters.type.filter(t => t !== type)
                              handleFilterChange({ ...filters, type: newTypes })
                            }}
                            className="mr-2"
                          />
                          <span className="capitalize">{type}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Planting Months</label>
                  <div className="flex gap-0.5 flex-wrap">
                    {['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'].map((month, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          const monthNum = index + 1
                          const newMonths = filters.planting_months.includes(monthNum)
                            ? filters.planting_months.filter(m => m !== monthNum)
                            : [...filters.planting_months, monthNum]
                          handleFilterChange({ ...filters, planting_months: newMonths })
                        }}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-medium ${
                          filters.planting_months.includes(index + 1)
                            ? 'bg-green-700 text-white'
                            : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                        }`}
                      >
                        {month}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Harvest Months</label>
                  <div className="flex gap-0.5 flex-wrap">
                    {['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'].map((month, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          const monthNum = index + 1
                          const newMonths = filters.harvested_months.includes(monthNum)
                            ? filters.harvested_months.filter(m => m !== monthNum)
                            : [...filters.harvested_months, monthNum]
                          handleFilterChange({ ...filters, harvested_months: newMonths })
                        }}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-medium ${
                          filters.harvested_months.includes(index + 1)
                            ? 'bg-red-700 text-white'
                            : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                        }`}
                      >
                        {month}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Watering Frequency</label>
                  <button
                    type="button"
                    onClick={() => setShowWateringDropdown(!showWateringDropdown)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 text-left bg-white relative"
                  >
                    <span className="block pr-8">{filters.watering_frequency.length === 0 ? 'All' : filters.watering_frequency.map(f => f.charAt(0).toUpperCase() + f.slice(1)).join(', ')}</span>
                    <svg className="w-4 h-4 text-gray-500 absolute right-2 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showWateringDropdown && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg">
                      {['low', 'medium', 'high'].map((freq) => (
                        <label key={freq} className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filters.watering_frequency.includes(freq)}
                            onChange={(e) => {
                              const newFreqs = e.target.checked
                                ? [...filters.watering_frequency, freq]
                                : filters.watering_frequency.filter(f => f !== freq)
                              handleFilterChange({ ...filters, watering_frequency: newFreqs })
                            }}
                            className="mr-2"
                          />
                          <span className="capitalize">{freq}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sunlight Requirement</label>
                  <button
                    type="button"
                    onClick={() => setShowSunlightDropdown(!showSunlightDropdown)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 text-left bg-white relative"
                  >
                    <span className="block pr-8">{filters.sunlight_requirement.length === 0 ? 'All' : filters.sunlight_requirement.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ')}</span>
                    <svg className="w-4 h-4 text-gray-500 absolute right-2 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showSunlightDropdown && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg">
                      {['low', 'partial', 'full'].map((sunlight) => (
                        <label key={sunlight} className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filters.sunlight_requirement.includes(sunlight)}
                            onChange={(e) => {
                              const newSunlight = e.target.checked
                                ? [...filters.sunlight_requirement, sunlight]
                                : filters.sunlight_requirement.filter(s => s !== sunlight)
                              handleFilterChange({ ...filters, sunlight_requirement: newSunlight })
                            }}
                            className="mr-2"
                          />
                          <span className="capitalize">{sunlight}</span>
                        </label>
                      ))}
                    </div>
                  )}
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
                          handleFilterChange({ ...filters, spacing_between_plants_min: val })
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
                          handleFilterChange({ ...filters, spacing_between_plants_max: val })
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
                          handleFilterChange({ ...filters, spacing_between_rows_min: val })
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
                          handleFilterChange({ ...filters, spacing_between_rows_max: val })
                        }
                      }}
                      className="absolute w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-green-700 [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-green-700 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleFilterChange({
                  type: [],
                  planting_months: [],
                  harvested_months: [],
                  watering_frequency: [],
                  sunlight_requirement: [],
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
          <>
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
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 h-14 line-clamp-2">
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
                      <span className="font-medium">{plant.days_to_maturity_text || `${plant.harvest_time_days} days`}</span>
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
                      <span className="text-gray-600">Growing Method:</span>
                      <span className="font-medium capitalize">{plant.growing_method || <span className="text-gray-400 italic">not set</span>}</span>
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
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="text-gray-700">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
          </>
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
                    <div className="border-b pb-4">
                      <div className="text-sm font-semibold text-gray-600 uppercase mb-3">
                        Plant Information
                      </div>
                      <div className="text-gray-900 space-y-3">
                        <div>
                          <span className="font-medium">🔬 Latin Name: </span>
                          {plant.latin_name ? (
                            <span className="italic">{plant.latin_name}</span>
                          ) : (
                            <span className="text-gray-400 italic">not set</span>
                          )}
                        </div>
                        <div>
                          <span className="font-medium">🏷️ Type: </span>
                          <span className="capitalize">{plant.type}</span>
                        </div>
                        <div>
                          <span className="font-medium">🌿 Variety: </span>
                          {plant.variety}
                        </div>
                        <div>
                          <span className="font-medium">🧬 Hybrid Status: </span>
                          {plant.hybrid_status || <span className="text-gray-400 italic">not set</span>}
                        </div>
                        <div>
                          <span className="font-medium">⏱️ Harvest Time: </span>
                          {plant.days_to_maturity_text || `${plant.harvest_time_days} days`}
                        </div>
                        <div>
                          <span className="font-medium">💧 Watering: </span>
                          <span className="capitalize">{plant.watering_frequency}</span>
                        </div>
                        <div>
                          <span className="font-medium">☀️ Sunlight: </span>
                          <span className="capitalize">{plant.sunlight_requirement}</span>
                        </div>
                        <div>
                          <span className="font-medium">🌱 Growing Method: </span>
                          {plant.growing_method ? (
                            <span className="capitalize">{plant.growing_method}</span>
                          ) : (
                            <span className="text-gray-400 italic">not set</span>
                          )}
                        </div>
                        <div>
                          <span className="font-medium">🌡️ Germination Temp: </span>
                          {plant.germination_temperature || <span className="text-gray-400 italic">not set</span>}
                        </div>
                        <div>
                          <span className="font-medium">🧪 Soil pH: </span>
                          {plant.soil_ph || <span className="text-gray-400 italic">not set</span>}
                        </div>
                        <div>
                          <span className="font-medium">📏 Plant Spacing: </span>
                          {plant.spacing_between_plants}cm
                        </div>
                        <div>
                          <span className="font-medium">📏 Row Spacing: </span>
                          {plant.spacing_between_rows}cm
                        </div>
                      </div>
                    </div>
                    {plant.details && plant.details.length > 0 && (
                      <div className="border-b pb-4">
                        <div className="text-sm font-semibold text-gray-600 uppercase mb-3">
                          Additional Details
                        </div>
                        <ul className="text-gray-900 space-y-2 list-disc list-inside">
                          {plant.details.map((detail, idx) => (
                            <li key={idx} className="text-sm">{detail}</li>
                          ))}
                        </ul>
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
