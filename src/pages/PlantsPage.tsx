import { useState, FormEvent } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPlants, getPlantDetails, createPlant, updatePlant } from '../api/plants'
import { getPlots } from '../api/plots'
import { createPlanting } from '../api/plantings'
import { getMe } from '../api/auth'
import { Layout } from '../components/Layout'
import { PlantImage } from '../components/PlantImage'
import { MonthIndicator } from '../components/MonthIndicator'
import { useLanguage } from '../contexts/LanguageContext'

export const PlantsPage = () => {
  const queryClient = useQueryClient()
  const { language } = useLanguage()
  const [showPlantDetails, setShowPlantDetails] = useState(false)
  const [selectedPlantForDetails, setSelectedPlantForDetails] = useState<string | null>(null)
  const [showAddToPlot, setShowAddToPlot] = useState(false)
  const [selectedPlantForPlot, setSelectedPlantForPlot] = useState<string | null>(null)
  const [selectedPlotId, setSelectedPlotId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [showCreatePlant, setShowCreatePlant] = useState(false)
  const [showEditPlant, setShowEditPlant] = useState(false)
  const [selectedPlantForEdit, setSelectedPlantForEdit] = useState<string | null>(null)
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
    lang: language,
  }

  const { data: plantsData, isLoading, error } = useQuery({
    queryKey: ['plants', activeFilters, language],
    queryFn: () => getPlants(activeFilters),
  })

  const plants = plantsData?.plants
  const totalPlants = plantsData?.total ?? 0
  const totalPages = Math.ceil(totalPlants / limit)

  const { data: plantDetails } = useQuery({
    queryKey: ['plantDetails', selectedPlantForDetails, language],
    queryFn: () => getPlantDetails(selectedPlantForDetails!, language),
    enabled: !!selectedPlantForDetails,
  })

  const { data: plots } = useQuery({
    queryKey: ['plots'],
    queryFn: () => getPlots(),
  })

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
  })

  const isAdmin = user?.is_admin || false

  const createPlantingMutation = useMutation({
    mutationFn: createPlanting,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plantings'] })
      setShowAddToPlot(false)
      setSelectedPlantForPlot(null)
      setSelectedPlotId('')
      setQuantity(1)
    },
  })

  const createPlantMutation = useMutation({
    mutationFn: createPlant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plants'] })
      setShowCreatePlant(false)
    },
  })

  const updatePlantMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updatePlant(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plants'] })
      setShowEditPlant(false)
      setSelectedPlantForEdit(null)
    },
  })

  const handleAddToPlot = (e: FormEvent) => {
    e.preventDefault()
    if (!selectedPlantForPlot || !selectedPlotId) return
    createPlantingMutation.mutate({ plant_id: selectedPlantForPlot, plot_id: selectedPlotId, quantity })
  }

  const handleCreatePlant = (e: FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    const data = {
      name: formData.get('name') as string,
      type: formData.get('type') as 'vegetable' | 'fruit',
      variety: formData.get('variety') as string,
      planting_months: (formData.get('planting_months') as string).split(',').map(Number).filter(Boolean),
      harvested_months: (formData.get('harvested_months') as string).split(',').map(Number).filter(Boolean),
      harvest_time_days: parseInt(formData.get('harvest_time_days') as string),
      watering_frequency: formData.get('watering_frequency') as 'low' | 'medium' | 'high',
      sunlight_requirement: formData.get('sunlight_requirement') as 'low' | 'partial' | 'full',
      spacing_between_plants: parseInt(formData.get('spacing_between_plants') as string),
      spacing_between_rows: parseInt(formData.get('spacing_between_rows') as string),
      days_to_maturity_text: (formData.get('days_to_maturity_text') as string) || undefined,
      germination_temperature: (formData.get('germination_temperature') as string) || undefined,
      growing_method: (formData.get('growing_method') as string) || undefined,
      hybrid_status: (formData.get('hybrid_status') as string) || undefined,
      latin_name: (formData.get('latin_name') as string) || undefined,
      soil_ph: (formData.get('soil_ph') as string) || undefined,
    }
    createPlantMutation.mutate(data)
  }

  const handleEditPlant = (e: FormEvent) => {
    e.preventDefault()
    if (!selectedPlantForEdit) return
    const originalPlant = plants?.find(p => p.id === selectedPlantForEdit)
    if (!originalPlant) return

    const formData = new FormData(e.target as HTMLFormElement)
    const updates: any = {}

    const name = formData.get('name') as string
    if (name !== originalPlant.name) updates.name = name

    const type = formData.get('type') as 'vegetable' | 'fruit'
    if (type !== originalPlant.type) updates.type = type

    const variety = formData.get('variety') as string
    if (variety !== originalPlant.variety) updates.variety = variety

    const planting_months = (formData.get('planting_months') as string).split(',').map(Number).filter(Boolean)
    if (JSON.stringify(planting_months) !== JSON.stringify(originalPlant.planting_months)) updates.planting_months = planting_months

    const harvested_months = (formData.get('harvested_months') as string).split(',').map(Number).filter(Boolean)
    if (JSON.stringify(harvested_months) !== JSON.stringify(originalPlant.harvested_months)) updates.harvested_months = harvested_months

    const harvest_time_days = parseInt(formData.get('harvest_time_days') as string)
    if (harvest_time_days !== originalPlant.harvest_time_days) updates.harvest_time_days = harvest_time_days

    const watering_frequency = formData.get('watering_frequency') as 'low' | 'medium' | 'high'
    if (watering_frequency !== originalPlant.watering_frequency) updates.watering_frequency = watering_frequency

    const sunlight_requirement = formData.get('sunlight_requirement') as 'low' | 'partial' | 'full'
    if (sunlight_requirement !== originalPlant.sunlight_requirement) updates.sunlight_requirement = sunlight_requirement

    const spacing_between_plants = parseInt(formData.get('spacing_between_plants') as string)
    if (spacing_between_plants !== originalPlant.spacing_between_plants) updates.spacing_between_plants = spacing_between_plants

    const spacing_between_rows = parseInt(formData.get('spacing_between_rows') as string)
    if (spacing_between_rows !== originalPlant.spacing_between_rows) updates.spacing_between_rows = spacing_between_rows

    const days_to_maturity_text = formData.get('days_to_maturity_text') as string
    if (days_to_maturity_text !== (originalPlant.days_to_maturity_text || '')) updates.days_to_maturity_text = days_to_maturity_text || undefined

    const germination_temperature = formData.get('germination_temperature') as string
    if (germination_temperature !== (originalPlant.germination_temperature || '')) updates.germination_temperature = germination_temperature || undefined

    const growing_method = formData.get('growing_method') as string
    if (growing_method !== (originalPlant.growing_method || '')) updates.growing_method = growing_method || undefined

    const hybrid_status = formData.get('hybrid_status') as string
    if (hybrid_status !== (originalPlant.hybrid_status || '')) updates.hybrid_status = hybrid_status || undefined

    const latin_name = formData.get('latin_name') as string
    if (latin_name !== (originalPlant.latin_name || '')) updates.latin_name = latin_name || undefined

    const soil_ph = formData.get('soil_ph') as string
    if (soil_ph !== (originalPlant.soil_ph || '')) updates.soil_ph = soil_ph || undefined

    if (Object.keys(updates).length > 0) {
      updatePlantMutation.mutate({ id: selectedPlantForEdit, data: updates })
    } else {
      setShowEditPlant(false)
      setSelectedPlantForEdit(null)
    }
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
            {isAdmin && (
              <button
                onClick={() => setShowCreatePlant(true)}
                className="bg-white shadow-md rounded-lg overflow-hidden border-2 border-dashed border-green-600 hover:border-green-700 hover:bg-green-50 transition-all flex items-center justify-center min-h-[400px] group relative"
              >
                <div className="absolute top-4 right-4 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center shadow-md">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto text-green-600 group-hover:text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <p className="mt-2 text-lg font-semibold text-green-600 group-hover:text-green-700">Add New Plant</p>
                </div>
              </button>
            )}
            {plants.map((plant) => (
              <div key={plant.id} className="bg-white shadow-md rounded-lg overflow-hidden">
                <div className="relative">
                  <PlantImage 
                    imageUrl={plant.url_image_principale}
                    alt={plant.titre_plante || plant.name || ''}
                    className="w-full h-40 object-contain bg-gray-50"
                  />
                  <div className="absolute top-2 left-2 flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedPlantForDetails(plant.id)
                        setShowPlantDetails(true)
                      }}
                      className="bg-white hover:bg-gray-100 text-gray-700 rounded-full p-2 shadow-md"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                    {isAdmin && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedPlantForEdit(plant.id)
                          setShowEditPlant(true)
                        }}
                        className="bg-yellow-400 hover:bg-yellow-500 text-white rounded-full p-2 shadow-md"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
                <div className="p-6">
                  <div className="mb-4 h-14">
                    <div className="text-xs text-gray-500 mb-1">{plant.famille_plante}</div>
                    <h3 className="text-xl font-semibold text-gray-900 line-clamp-2">
                      {plant.titre_plante}
                    </h3>
                  </div>
                  <div className="space-y-3 mb-4">
                    <MonthIndicator label="Seedling" months={plant.details?.culture?.['periode_de_semis (sous_abri)'] as string[] | undefined} color="green" />
                    <MonthIndicator label="Harvest" months={plant.details?.culture?.['periode_de_recolte'] as string[] | undefined} color="red" />
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium">{plant.category || plant.type || <span className="text-gray-400 italic">Not Set</span>}</span>
                    </div>
                    {!!plant.details?.culture?.culture && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Culture:</span>
                        <span className="font-medium">{Array.isArray(plant.details.culture.culture) ? (plant.details.culture.culture as string[]).join(', ') : String(plant.details.culture.culture)}</span>
                      </div>
                    )}
                    {(() => {
                      const seedlingMonths = plant.details?.culture?.['periode_de_semis (sous_abri)'] as string[] | undefined;
                      const harvestMonths = plant.details?.culture?.['periode_de_recolte'] as string[] | undefined;
                      
                      const monthMap: Record<string, number> = {
                        'Janvier': 1, 'Février': 2, 'Mars': 3, 'Avril': 4, 'Mai': 5, 'Juin': 6,
                        'Juillet': 7, 'Août': 8, 'Septembre': 9, 'Octobre': 10, 'Novembre': 11, 'Décembre': 12
                      };
                      
                      if (seedlingMonths && seedlingMonths.length > 0 && harvestMonths && harvestMonths.length > 0) {
                        const firstSeedlingMonth = monthMap[seedlingMonths[0]];
                        const firstHarvestMonth = monthMap[harvestMonths[0]];
                        
                        if (firstSeedlingMonth && firstHarvestMonth) {
                          const diff = firstHarvestMonth - firstSeedlingMonth;
                          const days = diff * 30;
                          
                          return (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Harvest Time:</span>
                              <span className="font-medium">{days}</span>
                            </div>
                          );
                        }
                      }
                      
                      if (plant.harvest_time_days) {
                        return (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Harvest Time:</span>
                            <span className="font-medium">{plant.days_to_maturity_text || `${plant.harvest_time_days} days`}</span>
                          </div>
                        );
                      }
                      
                      return null;
                    })()}
                    {!!plant.details?.culture?.besoin_en_eau && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Besoin en eau:</span>
                        <span className="font-medium capitalize">{String(plant.details.culture.besoin_en_eau)}</span>
                      </div>
                    )}
                    {!!plant.details?.culture?.exposition && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Exposition:</span>
                        <div className="flex gap-1">
                          {(() => {
                            const expositions = Array.isArray(plant.details.culture.exposition) 
                              ? plant.details.culture.exposition as string[]
                              : [String(plant.details.culture.exposition)];
                            
                            const expositionOrder = [
                              { key: 'plein soleil', icon: '/icons/plein-soleil.png' },
                              { key: 'ensoleillée', icon: '/icons/ensoleillee.png' },
                              { key: 'mi-ombre', icon: '/icons/mi-ombre.png' },
                              { key: 'ombre', icon: '/icons/ombre.png' }
                            ];
                            
                            const normalizedExpositions = expositions.map(e => e.toLowerCase());
                            
                            return expositionOrder
                              .filter(({ key }) => normalizedExpositions.includes(key))
                              .map(({ key, icon }, idx) => (
                                <div key={idx} className="relative group">
                                  <img src={icon} alt={key} className="w-6 h-6" />
                                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                    {key}
                                  </span>
                                </div>
                              ));
                          })()}
                        </div>
                      </div>
                    )}
                    {!!plant.details?.culture?.nature_du_sol && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Nature du sol:</span>
                        <div className="flex gap-1">
                          {(() => {
                            const soilTypes = Array.isArray(plant.details.culture.nature_du_sol)
                              ? plant.details.culture.nature_du_sol as string[]
                              : [String(plant.details.culture.nature_du_sol)];
                            
                            const soilTypeOrder = [
                              { key: 'bruyère', icon: '/icons/bruyere.png' },
                              { key: 'argileux', icon: '/icons/argileux.png' },
                              { key: 'terreau', icon: '/icons/terreau.png' },
                              { key: 'calcaire', icon: '/icons/calcaire.png' },
                              { key: 'littoral', icon: '/icons/littoral.png' },
                              { key: 'caillouteux', icon: '/icons/caillouteux.png' },
                              { key: 'humifère', icon: '/icons/humifere.png' },
                              { key: 'tout type de sol', icon: '/icons/tout-type-de-sol.png' }
                            ];
                            
                            const normalizedSoilTypes = soilTypes.map(s => s.toLowerCase());
                            
                            return soilTypeOrder
                              .filter(({ key }) => normalizedSoilTypes.includes(key))
                              .map(({ key, icon }, idx) => (
                                <div key={idx} className="relative group">
                                  <img src={icon} alt={key} className="w-6 h-6" />
                                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                    {key}
                                  </span>
                                </div>
                              ));
                          })()}
                        </div>
                      </div>
                    )}
                    {plant.distance_par_plante ? (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Distance par plante:</span>
                        <span className="font-medium">{plant.distance_par_plante} cm</span>
                      </div>
                    ) : (
                      plant.spacing_between_plants && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Distance par plante:</span>
                          <span className="font-medium">{plant.spacing_between_plants} cm</span>
                        </div>
                      )
                    )}
                    {plant.distance_par_rangee ? (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Distance par rangée:</span>
                        <span className="font-medium">{plant.distance_par_rangee} cm</span>
                      </div>
                    ) : (
                      plant.spacing_between_rows && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Distance par rangée:</span>
                          <span className="font-medium">{plant.spacing_between_rows} cm</span>
                        </div>
                      )
                    )}
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
              style={{ background: 'rgba(0, 0, 0, 0.3)' }}
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
                        imageUrl={plant.url_image_principale}
                        alt={plant.titre_plante || plant.name || ''}
                        className="w-24 h-24 object-contain bg-gray-50 rounded-lg"
                      />
                      <div>
                        <div className="text-sm text-gray-500 mb-1">{plant.famille_plante}</div>
                        <h2 className="text-2xl font-bold text-gray-900">{plant.titre_plante}</h2>
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
                        <MonthIndicator label="Seedling" months={plant.details?.culture?.['periode_de_semis (sous_abri)'] as string[] | undefined} color="green" />
                        <MonthIndicator label="Harvest" months={plant.details?.culture?.['periode_de_recolte'] as string[] | undefined} color="red" />
                      </div>
                    </div>
                    <div className="border-b pb-4">
                      <div className="text-sm font-semibold text-gray-600 uppercase mb-3">
                        Plant Information
                      </div>
                      <div className="text-gray-900 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Type:</span>
                          <span className="font-medium">{plant.category || plant.type}</span>
                        </div>
                        {!!plant.details?.culture?.culture && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Culture:</span>
                            <span className="font-medium">{Array.isArray(plant.details.culture.culture) ? (plant.details.culture.culture as string[]).join(', ') : String(plant.details.culture.culture)}</span>
                          </div>
                        )}
                        {!!plant.details?.caracteristiques?.taille_des_plants_min && !!plant.details?.caracteristiques?.taille_des_plants_max && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Harvest Time:</span>
                            <span className="font-medium">{String(plant.details.caracteristiques.taille_des_plants_min)} - {String(plant.details.caracteristiques.taille_des_plants_max)} cm</span>
                          </div>
                        )}
                        {!!plant.details?.culture?.besoin_en_eau && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Besoin en eau:</span>
                            <span className="font-medium capitalize">{String(plant.details.culture.besoin_en_eau)}</span>
                          </div>
                        )}
                        {!!plant.details?.culture?.exposition && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Exposition:</span>
                            <div className="flex gap-1">
                              {(() => {
                                const expositions = Array.isArray(plant.details.culture.exposition) 
                                  ? plant.details.culture.exposition as string[]
                                  : [plant.details.culture.exposition as string];
                                
                                const expositionOrder = [
                                  { key: 'plein soleil', icon: '/icons/plein-soleil.png' },
                                  { key: 'ensoleillée', icon: '/icons/ensoleillee.png' },
                                  { key: 'mi-ombre', icon: '/icons/mi-ombre.png' },
                                  { key: 'ombre', icon: '/icons/ombre.png' }
                                ];
                                
                                const normalizedExpositions = expositions.map(e => e.toLowerCase());
                                
                                return expositionOrder
                                  .filter(({ key }) => normalizedExpositions.includes(key))
                                  .map(({ key, icon }, idx) => (
                                    <div key={idx} className="relative group">
                                      <img src={icon} alt={key} className="w-6 h-6" />
                                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                        {key}
                                      </span>
                                    </div>
                                  ));
                              })()}
                            </div>
                          </div>
                        )}
                        {!!plant.details?.culture?.nature_du_sol && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Nature du sol:</span>
                            <div className="flex gap-1">
                              {(() => {
                                const soilTypes = Array.isArray(plant.details.culture.nature_du_sol)
                                  ? plant.details.culture.nature_du_sol as string[]
                                  : [String(plant.details.culture.nature_du_sol)];
                                
                                const soilTypeOrder = [
                                  { key: 'bruyère', icon: '/icons/bruyere.png' },
                                  { key: 'argileux', icon: '/icons/argileux.png' },
                                  { key: 'terreau', icon: '/icons/terreau.png' },
                                  { key: 'calcaire', icon: '/icons/calcaire.png' },
                                  { key: 'littoral', icon: '/icons/littoral.png' },
                                  { key: 'caillouteux', icon: '/icons/caillouteux.png' },
                                  { key: 'humifère', icon: '/icons/humifere.png' },
                                  { key: 'tout type de sol', icon: '/icons/tout-type-de-sol.png' }
                                ];
                                
                                const normalizedSoilTypes = soilTypes.map(s => s.toLowerCase());
                                
                                return soilTypeOrder
                                  .filter(({ key }) => normalizedSoilTypes.includes(key))
                                  .map(({ key, icon }, idx) => (
                                    <div key={idx} className="relative group">
                                      <img src={icon} alt={key} className="w-6 h-6" />
                                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                        {key}
                                      </span>
                                    </div>
                                  ));
                              })()}
                            </div>
                          </div>
                        )}
                        {plant.distance_par_plante && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Distance par plante:</span>
                            <span className="font-medium">{plant.distance_par_plante} cm</span>
                          </div>
                        )}
                        {plant.distance_par_rangee && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Distance par rangée:</span>
                            <span className="font-medium">{plant.distance_par_rangee} cm</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {!!plant.details?.utilisation?.usage && (
                      <div className="border-b pb-4">
                        <div className="text-sm font-semibold text-gray-600 uppercase mb-3">
                          Usage
                        </div>
                        <div className="text-gray-900 text-sm">
                          {String(plant.details.utilisation.usage)}
                        </div>
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
            <div 
              className="fixed inset-0 flex items-center justify-center p-4 z-50" 
              style={{ background: 'rgba(0, 0, 0, 0.3)' }}
            >
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

                    {createPlantingMutation.isError && (
                      <div className="text-red-600 text-sm">
                        {createPlantingMutation.error.message}
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
                        disabled={createPlantingMutation.isPending || !selectedPlotId}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50"
                      >
                        {createPlantingMutation.isPending ? 'Adding...' : 'Add Plant'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )
        })()}

        {showCreatePlant && (
          <div 
            className="fixed inset-0 flex items-center justify-center p-4 z-50" 
            style={{ background: 'rgba(0, 0, 0, 0.3)' }}
          >
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Create New Plant</h2>
                  <button
                    onClick={() => setShowCreatePlant(false)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>
                <form onSubmit={handleCreatePlant} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Type *
                      </label>
                      <select
                        name="type"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="">Select type...</option>
                        <option value="vegetable">Vegetable</option>
                        <option value="fruit">Fruit</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Variety *
                      </label>
                      <input
                        type="text"
                        name="variety"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Latin Name
                      </label>
                      <input
                        type="text"
                        name="latin_name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Planting Months * (comma-separated, e.g., 1,2,3)
                      </label>
                      <input
                        type="text"
                        name="planting_months"
                        required
                        placeholder="e.g., 3,4,5"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Harvested Months * (comma-separated)
                      </label>
                      <input
                        type="text"
                        name="harvested_months"
                        required
                        placeholder="e.g., 7,8,9"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Harvest Time (days) *
                      </label>
                      <input
                        type="number"
                        name="harvest_time_days"
                        required
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Days to Maturity Text
                      </label>
                      <input
                        type="text"
                        name="days_to_maturity_text"
                        placeholder="e.g., 60-80 days"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Watering Frequency *
                      </label>
                      <select
                        name="watering_frequency"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="">Select frequency...</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sunlight Requirement *
                      </label>
                      <select
                        name="sunlight_requirement"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="">Select requirement...</option>
                        <option value="low">Low</option>
                        <option value="partial">Partial</option>
                        <option value="full">Full</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Growing Method
                      </label>
                      <input
                        type="text"
                        name="growing_method"
                        placeholder="e.g., direct seed, transplant"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Germination Temperature
                      </label>
                      <input
                        type="text"
                        name="germination_temperature"
                        placeholder="e.g., 15-25°C"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Soil pH
                      </label>
                      <input
                        type="text"
                        name="soil_ph"
                        placeholder="e.g., 6.0-7.0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Hybrid Status
                      </label>
                      <input
                        type="text"
                        name="hybrid_status"
                        placeholder="e.g., F1 hybrid, heirloom"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Spacing Between Plants (cm) *
                      </label>
                      <input
                        type="number"
                        name="spacing_between_plants"
                        required
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Spacing Between Rows (cm) *
                      </label>
                      <input
                        type="number"
                        name="spacing_between_rows"
                        required
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                  </div>
                  {createPlantMutation.isError && (
                    <div className="text-red-600 text-sm">
                      {createPlantMutation.error.message}
                    </div>
                  )}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowCreatePlant(false)}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createPlantMutation.isPending}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50"
                    >
                      {createPlantMutation.isPending ? 'Creating...' : 'Create Plant'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {showEditPlant && selectedPlantForEdit && (() => {
          const plant = plants?.find(p => p.id === selectedPlantForEdit)
          if (!plant) return null

          return (
            <div 
              className="fixed inset-0 flex items-center justify-center p-4 z-50" 
              style={{ background: 'rgba(0, 0, 0, 0.3)' }}
            >
              <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-900">Edit Plant</h2>
                    <button
                      onClick={() => {
                        setShowEditPlant(false)
                        setSelectedPlantForEdit(null)
                      }}
                      className="text-gray-400 hover:text-gray-600 text-2xl"
                    >
                      ×
                    </button>
                  </div>
                  <form onSubmit={handleEditPlant} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                        <input type="text" name="name" required defaultValue={plant.name} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                        <select name="type" required defaultValue={plant.type} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500">
                          <option value="">Select type...</option>
                          <option value="vegetable">Vegetable</option>
                          <option value="fruit">Fruit</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Variety *</label>
                        <input type="text" name="variety" required defaultValue={plant.variety} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Latin Name</label>
                        <input type="text" name="latin_name" defaultValue={plant.latin_name || ''} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Planting Months * (comma-separated)</label>
                        <input type="text" name="planting_months" required defaultValue={plant.planting_months?.join(',') || ''} placeholder="e.g., 3,4,5" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Harvested Months * (comma-separated)</label>
                        <input type="text" name="harvested_months" required defaultValue={plant.harvested_months?.join(',') || ''} placeholder="e.g., 7,8,9" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Harvest Time (days) *</label>
                        <input type="number" name="harvest_time_days" required min="1" defaultValue={plant.harvest_time_days} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Days to Maturity Text</label>
                        <input type="text" name="days_to_maturity_text" placeholder="e.g., 60-80 days" defaultValue={plant.days_to_maturity_text || ''} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Watering Frequency *</label>
                        <select name="watering_frequency" required defaultValue={plant.watering_frequency} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500">
                          <option value="">Select frequency...</option>
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sunlight Requirement *</label>
                        <select name="sunlight_requirement" required defaultValue={plant.sunlight_requirement} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500">
                          <option value="">Select requirement...</option>
                          <option value="low">Low</option>
                          <option value="partial">Partial</option>
                          <option value="full">Full</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Growing Method</label>
                        <input type="text" name="growing_method" placeholder="e.g., direct seed, transplant" defaultValue={plant.growing_method || ''} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Germination Temperature</label>
                        <input type="text" name="germination_temperature" placeholder="e.g., 15-25°C" defaultValue={plant.germination_temperature || ''} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Soil pH</label>
                        <input type="text" name="soil_ph" placeholder="e.g., 6.0-7.0" defaultValue={plant.soil_ph || ''} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Hybrid Status</label>
                        <input type="text" name="hybrid_status" placeholder="e.g., F1 hybrid, heirloom" defaultValue={plant.hybrid_status || ''} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Spacing Between Plants (cm) *</label>
                        <input type="number" name="spacing_between_plants" required min="1" defaultValue={plant.spacing_between_plants} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Spacing Between Rows (cm) *</label>
                        <input type="number" name="spacing_between_rows" required min="1" defaultValue={plant.spacing_between_rows} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500" />
                      </div>
                    </div>
                    {updatePlantMutation.isError && (
                      <div className="text-red-600 text-sm">{updatePlantMutation.error.message}</div>
                    )}
                    <div className="flex gap-3 pt-4">
                      <button type="button" onClick={() => { setShowEditPlant(false); setSelectedPlantForEdit(null); }} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md font-medium">Cancel</button>
                      <button type="submit" disabled={updatePlantMutation.isPending} className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50">{updatePlantMutation.isPending ? 'Updating...' : 'Update Plant'}</button>
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
