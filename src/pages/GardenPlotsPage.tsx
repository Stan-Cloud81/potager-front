import { useState, FormEvent } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPlots, createPlot } from '../api/plots'
import { CreateGardenPlotRequest } from '../types'
import { Layout } from '../components/Layout'

export const GardenPlotsPage = () => {
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<CreateGardenPlotRequest>({
    name: '',
    width: 0,
    length: 0,
    soil_type: 'loamy',
    sunlight_exposure: 'full',
  })

  const queryClient = useQueryClient()

  const { data: plots, isLoading, error } = useQuery({
    queryKey: ['plots'],
    queryFn: () => getPlots(),
  })

  const createMutation = useMutation({
    mutationFn: createPlot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plots'] })
      setShowForm(false)
      setFormData({
        name: '',
        width: 0,
        length: 0,
        soil_type: 'loamy',
        sunlight_exposure: 'full',
      })
    },
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    createMutation.mutate(formData)
  }

  return (
    <Layout>
      <div className="px-4 sm:px-0">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Garden Plots</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            {showForm ? 'Cancel' : 'Add Plot'}
          </button>
        </div>

        {showForm && (
          <div className="bg-white shadow-md rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Create New Garden Plot</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                    min="0"
                    step="0.1"
                    value={formData.width}
                    onChange={(e) => setFormData({ ...formData, width: parseFloat(e.target.value) })}
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
                    min="0"
                    step="0.1"
                    value={formData.length}
                    onChange={(e) => setFormData({ ...formData, length: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Soil Type
                </label>
                <select
                  value={formData.soil_type}
                  onChange={(e) => setFormData({ ...formData, soil_type: e.target.value as 'clay' | 'sandy' | 'loamy' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                >
                  <option value="clay">Clay</option>
                  <option value="sandy">Sandy</option>
                  <option value="loamy">Loamy</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sunlight Exposure
                </label>
                <select
                  value={formData.sunlight_exposure}
                  onChange={(e) => setFormData({ ...formData, sunlight_exposure: e.target.value as 'low' | 'partial' | 'full' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                >
                  <option value="low">Low</option>
                  <option value="partial">Partial</option>
                  <option value="full">Full</option>
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
                {createMutation.isPending ? 'Creating...' : 'Create Plot'}
              </button>
            </form>
          </div>
        )}

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

        {plots && plots.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No garden plots found. Create one to get started!</p>
          </div>
        )}

        {plots && plots.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plots.map((plot) => (
              <div key={plot.id} className="bg-white shadow-md rounded-lg overflow-hidden">
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {plot.name}
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Dimensions:</span>
                      <span className="font-medium">{plot.width}m × {plot.length}m</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Area:</span>
                      <span className="font-medium">{(plot.width * plot.length).toFixed(1)} m²</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Soil Type:</span>
                      <span className="font-medium capitalize">{plot.soil_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sunlight:</span>
                      <span className="font-medium capitalize">{plot.sunlight_exposure}</span>
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
