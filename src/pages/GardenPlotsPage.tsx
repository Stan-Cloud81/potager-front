import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPlots, createPlot } from '../api/plots'
import { getPlantings } from '../api/plantings'
import { getPlants } from '../api/plants'
import { CreateGardenPlotRequest } from '../types'
import { Layout } from '../components/Layout'

export const GardenPlotsPage = () => {
  const navigate = useNavigate()
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<CreateGardenPlotRequest>({
    nom: '',
    largeur: 0,
    longueur: 0,
    nature_du_sol: 'terreau',
    exposition: 'plein soleil',
  })

  const queryClient = useQueryClient()

  const { data: plots, isLoading, error } = useQuery({
    queryKey: ['plots'],
    queryFn: () => getPlots(),
  })

  const { data: plantings } = useQuery({
    queryKey: ['plantings'],
    queryFn: () => getPlantings(),
  })

  const { data: plants } = useQuery({
    queryKey: ['plants'],
    queryFn: () => getPlants(),
  })

  const createMutation = useMutation({
    mutationFn: createPlot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plots'] })
      setShowForm(false)
      setFormData({
        nom: '',
        largeur: 0,
        longueur: 0,
        nature_du_sol: 'terreau',
        exposition: 'plein soleil',
      })
    },
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    createMutation.mutate(formData)
  }

  const getPlotCounts = (plotId: string) => {
    if (!plantings || !plants) {
      return { vegetables: 0, fruits: 0 }
    }

    const plotPlantings = plantings.filter(p => p.plot_id === plotId && p.status !== 'harvested')
    
    let vegetables = 0
    let fruits = 0

    plotPlantings.forEach(planting => {
      const plant = plants?.plants?.find(p => p.id === planting.plant_id)
      if (plant) {
        if (plant.type === 'vegetable') {
          vegetables++
        } else if (plant.type === 'fruit') {
          fruits++
        }
      }
    })

    return { vegetables, fruits }
  }

  return (
    <Layout>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">My Garden Plots</h1>

        {isLoading && (
          <div className="text-center py-12">
            <div className="text-gray-500">Loading plots...</div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Error loading plots: {error.message}</p>
          </div>
        )}

        {!isLoading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {plots?.map((plot) => {
              const counts = getPlotCounts(plot.id)
              return (
                <div 
                  key={plot.id} 
                  onClick={() => navigate(`/plots/${plot.id}`)}
                  className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow cursor-pointer"
                >
                  <div className="p-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                      {plot.nom.charAt(0).toUpperCase() + plot.nom.slice(1)}
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
                        <span className="text-gray-700 font-medium">Area</span>
                        <span className="text-xl font-bold text-green-600">
                          {((plot.largeur / 100) * (plot.longueur / 100)).toFixed(2)} m²
                        </span>
                      </div>
                      <div className="flex items-center justify-between bg-orange-50 p-3 rounded-lg">
                        <span className="text-gray-700 font-medium">🥕 Vegetables</span>
                        <span className="text-xl font-bold text-orange-600">
                          {counts.vegetables}
                        </span>
                      </div>
                      <div className="flex items-center justify-between bg-red-50 p-3 rounded-lg">
                        <span className="text-gray-700 font-medium">🍓 Fruits</span>
                        <span className="text-xl font-bold text-red-600">
                          {counts.fruits}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            <div 
              onClick={() => setShowForm(true)}
              className="bg-white shadow-lg rounded-xl overflow-hidden border-2 border-dashed border-green-300 hover:border-green-500 hover:shadow-xl transition-all cursor-pointer flex items-center justify-center min-h-[280px]"
            >
              <div className="text-center p-6">
                <div className="text-6xl text-green-500 mb-2">+</div>
                <p className="text-lg font-medium text-gray-700">Add New Plot</p>
              </div>
            </div>
          </div>
        )}

        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Create New Garden Plot</h2>
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
                      Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.nom}
                      onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                      placeholder="e.g. Front Garden"
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
                        value={formData.largeur ? formData.largeur / 100 : ''}
                        onChange={(e) => setFormData({ ...formData, largeur: (parseFloat(e.target.value) || 0) * 100})}
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
                        value={formData.longueur ? formData.longueur / 100 : ''}
                        onChange={(e) => setFormData({ ...formData, longueur: (parseFloat(e.target.value) || 0) * 100 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Soil Type
                    </label>
                    <select
                      value={formData.nature_du_sol}
                      onChange={(e) => setFormData({ ...formData, nature_du_sol: e.target.value as 'bruyère' | 'argileux' | 'terreau' | 'calcaire' | 'littoral' | 'caillouteux' | 'humifère' })}
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
                      value={formData.exposition}
                      onChange={(e) => setFormData({ ...formData, exposition: e.target.value as 'plein soleil' | 'ensoleillée' | 'mi-ombre' | 'ombre' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="plein soleil">Plein soleil</option>
                      <option value="ensoleillée">Ensoleillée</option>
                      <option value="mi-ombre">Mi-ombre</option>
                      <option value="ombre">Ombre</option>
                    </select>
                  </div>
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
                      disabled={createMutation.isPending}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50"
                    >
                      {createMutation.isPending ? 'Creating...' : 'Create'}
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
