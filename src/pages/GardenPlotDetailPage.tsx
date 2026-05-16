import { useState, FormEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPlot, updatePlot } from '../api/plots'
import { getPlantings, createPlanting, updatePlantingStatus, updatePlantingQuantity, deletePlanting } from '../api/plantings'
import { getPlants, getPlant, getPlantDetails } from '../api/plants'
import { Layout } from '../components/Layout'
import { PlantImage } from '../components/PlantImage'
import { MonthIndicator } from '../components/MonthIndicator'
import { GardenPlotVisual } from '../components/GardenPlotVisual'
import { formatDate, formatDateFrench } from '../utils/date'
import { useLanguage } from '../contexts/LanguageContext'

export const GardenPlotDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { language } = useLanguage()
  const [showForm, setShowForm] = useState(false)
  const [selectedPlantId, setSelectedPlantId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [plantSearchQuery, setPlantSearchQuery] = useState('')
  const [showPlantDetails, setShowPlantDetails] = useState(false)
  const [selectedPlantForDetails, setSelectedPlantForDetails] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [plantingToDelete, setPlantingToDelete] = useState<string | null>(null)
  const [hasOverlap, setHasOverlap] = useState(false)
  const [showHarvested, setShowHarvested] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editFormData, setEditFormData] = useState<{
    nom: string
    largeur: number
    longueur: number
    nature_du_sol: 'bruyère' | 'argileux' | 'terreau' | 'calcaire' | 'littoral' | 'caillouteux' | 'humifère'
    exposition: 'plein soleil' | 'ensoleillée' | 'mi-ombre' | 'ombre'
  }>({ nom: '', largeur: 0, longueur: 0, nature_du_sol: 'terreau', exposition: 'plein soleil' })

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
    queryKey: ['plants', plantSearchQuery, language],
    queryFn: () => getPlants({ search: plantSearchQuery || undefined, limit: 1000, lang: language }),
  })

  const { data: plantDetails } = useQuery({
    queryKey: ['plantDetails', selectedPlantForDetails, language],
    queryFn: () => getPlantDetails(selectedPlantForDetails!, language),
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
    mutationFn: async ({ id, status }: { id: string; status: 'planned' | 'planted' | 'harvested' }) => {
      await updatePlantingStatus(id, { status })
      if (status === 'planned') {
        const { updatePlantingPosition } = await import('../api/plantings')
        await updatePlantingPosition(id, { position_x: 0, position_y: 0, individual_positions: [] })
      }
    },
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

  const updatePlotMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<typeof editFormData> }) =>
      updatePlot(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plot', id] })
      setShowEditForm(false)
    },
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!selectedPlantId || !id) return
    createMutation.mutate({ plant_id: selectedPlantId, plot_id: id, quantity })
  }

  const plotPlantings = allPlantings?.filter(p => p.plot_id === id) || []
  const activePlantings = plotPlantings.filter(p => p.status !== 'harvested')
  const harvestedPlantings = plotPlantings.filter(p => p.status === 'harvested')

  const plantQueries = useQuery({
    queryKey: ['plotPlants', id, plotPlantings.map(p => p.plant_id).join(','), language],
    queryFn: async () => {
      const uniquePlantIds = [...new Set(plotPlantings.map(p => p.plant_id))]
      const plantPromises = uniquePlantIds.map(plantId => 
        getPlant(plantId, language).catch(() => null)
      )
      const fetchedPlants = await Promise.all(plantPromises)
      return fetchedPlants.filter(p => p !== null)
    },
    enabled: plotPlantings.length > 0,
  })

  const getPlantInfo = (plantId: string) => {
    return plantQueries.data?.find(p => p.id === plantId) || plants?.plants?.find(p => p.id === plantId)
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
          <div className="group space-y-2">
            <div className="inline-flex items-center gap-2">
              <h1 className="text-3xl font-bold text-gray-900">{plot.nom.charAt(0).toUpperCase() + plot.nom.slice(1)}</h1>
              <button
                onClick={() => {
                  setEditFormData({
                    nom: plot.nom,
                    largeur: plot.largeur,
                    longueur: plot.longueur,
                    nature_du_sol: plot.nature_du_sol,
                    exposition: plot.exposition,
                  })
                  setShowEditForm(true)
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600 p-1 border border-gray-300 rounded hover:border-gray-400"
                title="Edit plot details"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </button>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              <span>{(plot.largeur / 100).toFixed(2)}m × {(plot.longueur / 100).toFixed(2)}m ({((plot.largeur / 100) * (plot.longueur / 100)).toFixed(2)} m²)</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <img src={`/icons/${plot.nature_du_sol.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()}.png`} alt={plot.nature_du_sol} className="h-5 w-5" />
              <span>{plot.nature_du_sol}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <img src={`/icons/${plot.exposition.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').toLowerCase()}.png`} alt={plot.exposition} className="h-5 w-5" />
              <span>{plot.exposition}</span>
            </div>
          </div>
        </div>

        {plantQueries.data && activePlantings.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Garden Layout</h2>
              {hasOverlap && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-sm">
                  ⚠️ Warning: Some plants are overlapping!
                </div>
              )}
            </div>
            <GardenPlotVisual
              plotId={plot.id}
              largeur={plot.largeur}
              longueur={plot.longueur}
              plantings={activePlantings}
              plants={plantQueries.data}
              onOverlapChange={setHasOverlap}
            />
          </div>
        )}

        <h2 className="text-2xl font-bold text-gray-900 mb-4">Plants</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {activePlantings.map((planting) => {
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
                    imageUrl={plant.url_image_principale}
                    alt={plant.titre_plante || plant.name || ''}
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
                      <div className="text-xs text-gray-500 mb-1">{plant.famille_plante}</div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {plant.titre_plante}
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
                    {(plant.type || plant.category) && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Type:</span>
                        <span className="font-medium capitalize">{plant.type || plant.category}</span>
                      </div>
                    )}
                    {plant.famille_plante && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Famille:</span>
                        <span className="font-medium">{plant.famille_plante}</span>
                      </div>
                    )}
                    {plant.details?.culture?.besoin_en_eau && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Besoin en eau:</span>
                        <span className="font-medium capitalize">{plant.details.culture.besoin_en_eau}</span>
                      </div>
                    )}
                    {(plant.distance_par_plante || plant.spacing_between_plants) && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Distance par plante:</span>
                        <span className="font-medium">{plant.distance_par_plante || plant.spacing_between_plants} cm</span>
                      </div>
                    )}
                    {(plant.distance_par_rangee || plant.spacing_between_rows) && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Distance par rangée:</span>
                        <span className="font-medium">{plant.distance_par_rangee || plant.spacing_between_rows} cm</span>
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-3 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Planté:</span>
                      <span className="font-medium">
                        {formatDateFrench(planting.planted_at)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Récolte dans:</span>
                      <span className="font-medium relative group cursor-help">
                        {(() => {
                          const harvestDate = new Date(planting.expected_harvest)
                          const today = new Date()
                          const daysLeft = Math.ceil((harvestDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                          return `${daysLeft} jour${daysLeft !== 1 ? 's' : ''}`
                        })()}
                        <span className="absolute bottom-full right-0 mb-1 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                          {formatDateFrench(planting.expected_harvest)}
                        </span>
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

        {activePlantings.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No plants in this plot yet. Click the + box to add one!
          </div>
        )}

        {harvestedPlantings.length > 0 && (
          <div className="mt-8">
            <button
              onClick={() => setShowHarvested(!showHarvested)}
              className="flex items-center gap-2 text-xl font-bold text-gray-900 mb-4 hover:text-gray-700 transition-colors"
            >
              <span className={`transform transition-transform ${showHarvested ? 'rotate-90' : ''}`}>
                ▶
              </span>
              Harvested Plants ({harvestedPlantings.length})
            </button>
            
            {showHarvested && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                {harvestedPlantings.map((planting) => {
                  const plant = getPlantInfo(planting.plant_id)
                  const previousStatus = getPreviousStatus(planting.status)
                  
                  if (!plant) return null

                  return (
                    <div
                      key={planting.id}
                      className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow opacity-80"
                    >
                      <div className="relative">
                        <PlantImage 
                          imageUrl={plant.url_image_principale}
                          alt={plant.titre_plante || plant.name || ''}
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
                            <div className="text-xs text-gray-500 mb-1">{plant.famille_plante}</div>
                            <h3 className="text-xl font-bold text-gray-900">
                              {plant.titre_plante}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-sm font-medium text-gray-700">Qty: {planting.quantity}</span>
                            </div>
                          </div>
                          <span className="px-3 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800">
                            HARVESTED
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
                              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-2 rounded-md text-sm font-medium truncate"
                            >
                              ← {previousStatus}
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setPlantingToDelete(planting.id)
                              setShowDeleteConfirm(true)
                            }}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {showForm && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ background: 'rgba(0, 0, 0, 0.3)' }}>
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Add Plant to {plot.nom.charAt(0).toUpperCase() + plot.nom.slice(1)}</h2>
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
                      Search Plant
                    </label>
                    <input
                      type="text"
                      value={plantSearchQuery}
                      onChange={(e) => setPlantSearchQuery(e.target.value)}
                      placeholder="Search by name or variety..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 mb-2"
                    />
                    <select
                      required
                      value={selectedPlantId}
                      onChange={(e) => setSelectedPlantId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 max-h-60"
                      size={8}
                    >
                      <option value="">Choose a plant...</option>
                      {plants?.plants?.map((plant) => (
                        <option key={plant.id} value={plant.id}>
                          {plant.famille_plante} - {plant.titre_plante}
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
                        const plant = plants?.plants?.find(p => p.id === selectedPlantId)
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
          const plant = plants?.plants?.find(p => p.id === selectedPlantForDetails)
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
            style={{ background: 'rgba(0, 0, 0, 0.3)' }}
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

        {showEditForm && plot && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ background: 'rgba(0, 0, 0, 0.3)' }}>
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Edit Plot Details</h2>
                  <button
                    onClick={() => setShowEditForm(false)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>
                <form onSubmit={(e) => {
                  e.preventDefault()
                  updatePlotMutation.mutate({ id: plot.id, data: editFormData })
                }} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      required
                      value={editFormData.nom}
                      onChange={(e) => setEditFormData({ ...editFormData, nom: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Width (m)
                      </label>
                      <input
                        type="number"
                        required
                        min="0.1"
                        step="0.1"
                        value={editFormData.largeur ? editFormData.largeur / 100 : ''}
                        onChange={(e) => setEditFormData({ ...editFormData, largeur: (parseFloat(e.target.value) || 0) * 100 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Length (m)
                      </label>
                      <input
                        type="number"
                        required
                        min="0.1"
                        step="0.1"
                        value={editFormData.longueur ? editFormData.longueur / 100 : ''}
                        onChange={(e) => setEditFormData({ ...editFormData, longueur: (parseFloat(e.target.value) || 0) * 100 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Soil Type
                    </label>
                    <select
                      value={editFormData.nature_du_sol}
                      onChange={(e) => setEditFormData({ ...editFormData, nature_du_sol: e.target.value as typeof editFormData.nature_du_sol })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="bruyère">Bruyère</option>
                      <option value="argileux">Argileux</option>
                      <option value="terreau">Terreau</option>
                      <option value="calcaire">Calcaire</option>
                      <option value="littoral">Littoral</option>
                      <option value="caillouteux">Caillouteux</option>
                      <option value="humifère">Humifère</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sunlight Exposure
                    </label>
                    <select
                      value={editFormData.exposition}
                      onChange={(e) => setEditFormData({ ...editFormData, exposition: e.target.value as typeof editFormData.exposition })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="plein soleil">Plein soleil</option>
                      <option value="ensoleillée">Ensoleillée</option>
                      <option value="mi-ombre">Mi-ombre</option>
                      <option value="ombre">Ombre</option>
                    </select>
                  </div>
                  {updatePlotMutation.isError && (
                    <div className="text-red-600 text-sm">
                      {updatePlotMutation.error.message}
                    </div>
                  )}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowEditForm(false)}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updatePlotMutation.isPending}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50"
                    >
                      {updatePlotMutation.isPending ? 'Saving...' : 'Save'}
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
