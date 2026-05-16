import { useState, useRef, useEffect } from 'react'
import { Plant, Planting, PlantPosition, IndividualPlantPosition } from '../types'
import { updatePlantPositions } from '../api/plantings'
import { useMutation } from '@tanstack/react-query'

type GardenPlotVisualProps = {
  plotId: string
  plotWidth: number
  plotLength: number
  plantings: Planting[]
  plants: Plant[]
  onOverlapChange?: (hasOverlap: boolean) => void
}

type DraggablePlant = {
  planting: Planting
  plant: Plant
  position: PlantPosition
}

type GridPosition = {
  row: number
  col: number
}

const MAX_HEIGHT = 600
const EDIT_CELL_SIZE = 60

export const GardenPlotVisual = ({ plotId, plotWidth, plotLength, plantings, plants, onOverlapChange }: GardenPlotVisualProps) => {
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024)
  const [windowHeight, setWindowHeight] = useState(typeof window !== 'undefined' ? window.innerHeight : 768)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleResize = () => {
      setWindowWidth(window.innerWidth)
      setWindowHeight(window.innerHeight)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isPortrait = windowWidth < windowHeight
  const shouldRotate = isPortrait ? plotWidth > plotLength : plotLength > plotWidth
  const isRotated = shouldRotate
  const displayWidth = isRotated ? plotLength : plotWidth
  const displayHeight = isRotated ? plotWidth : plotLength

  const maxVisualHeight = isPortrait ? windowHeight * 0.6 : MAX_HEIGHT
  const scale = Math.min(5, maxVisualHeight / displayHeight)
  const visualWidth = displayWidth * scale
  const visualHeight = displayHeight * scale

  const [positions, setPositions] = useState<PlantPosition[]>(() => {
    return plantings.map((p, i) => ({
      planting_id: p.id,
      x: Math.round((10 + (i % 3) * 30) / 5) * 5,
      y: Math.round((10 + Math.floor(i / 3) * 30) / 5) * 5,
    }))
  })

  const getOriginalPosition = (x: number, y: number, width: number, height: number) => {
    if (isRotated) {
      return {
        x: plotLength - y - height,
        y: x,
      }
    }
    return { x, y }
  }

  const [gridPositions, setGridPositions] = useState<Map<string, GridPosition[]>>(new Map())
  const [isSaving, setIsSaving] = useState(false)

  const savePositionsMutation = useMutation({
    mutationFn: (data: { positions: PlantPosition[]; individual_positions?: IndividualPlantPosition[] }) =>
      updatePlantPositions(plotId, data),
  })

  const [editingPlantingId, setEditingPlantingId] = useState<string | null>(null)
  const [draggedPlant, setDraggedPlant] = useState<string | null>(null)
  const [draggedGridIndex, setDraggedGridIndex] = useState<number | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const editContainerRef = useRef<HTMLDivElement>(null)

  const draggablePlants: DraggablePlant[] = plantings.map(planting => {
    const plant = plants.find(p => p.id === planting.plant_id)!
    const position = positions.find(pos => pos.planting_id === planting.id) || { planting_id: planting.id, x: 0, y: 0 }
    return { planting, plant, position }
  }).filter(dp => dp.plant)

  const getPlantRect = (dp: DraggablePlant) => {
    const baseWidth = isRotated ? dp.plant.spacing_between_rows : dp.plant.spacing_between_plants
    const baseHeight = isRotated ? dp.plant.spacing_between_plants : dp.plant.spacing_between_rows

    const gridPos = gridPositions.get(dp.planting.id)
    if (gridPos && gridPos.length > 0) {
      const minRow = Math.min(...gridPos.map(p => p.row))
      const maxRow = Math.max(...gridPos.map(p => p.row))
      const minCol = Math.min(...gridPos.map(p => p.col))
      const maxCol = Math.max(...gridPos.map(p => p.col))

      return {
        x: dp.position.x,
        y: dp.position.y,
        width: (maxCol - minCol + 1) * baseWidth,
        height: (maxRow - minRow + 1) * baseHeight,
      }
    }

    return {
      x: dp.position.x,
      y: dp.position.y,
      width: baseWidth * dp.planting.quantity,
      height: baseHeight,
    }
  }

  const checkOverlap = (rect1: { x: number; y: number; width: number; height: number }, rect2: { x: number; y: number; width: number; height: number }) => {
    return !(
      rect1.x + rect1.width <= rect2.x ||
      rect2.x + rect2.width <= rect1.x ||
      rect1.y + rect1.height <= rect2.y ||
      rect2.y + rect2.height <= rect1.y
    )
  }

  const hasOverlap = (plantingId: string) => {
    const currentPlant = draggablePlants.find(dp => dp.planting.id === plantingId)
    if (!currentPlant) return false

    const baseWidth = isRotated ? currentPlant.plant.spacing_between_rows : currentPlant.plant.spacing_between_plants
    const baseHeight = isRotated ? currentPlant.plant.spacing_between_plants : currentPlant.plant.spacing_between_rows
    const currentGridPos = gridPositions.get(plantingId)

    if (currentGridPos && currentGridPos.length > 0) {
      const minRow = Math.min(...currentGridPos.map(p => p.row))
      const minCol = Math.min(...currentGridPos.map(p => p.col))

      const currentCells = currentGridPos.map(pos => ({
        x: currentPlant.position.x + (pos.col - minCol) * baseWidth,
        y: currentPlant.position.y + (pos.row - minRow) * baseHeight,
        width: baseWidth,
        height: baseHeight,
      }))

      return draggablePlants.some(dp => {
        if (dp.planting.id === plantingId) return false

        const otherBaseWidth = isRotated ? dp.plant.spacing_between_rows : dp.plant.spacing_between_plants
        const otherBaseHeight = isRotated ? dp.plant.spacing_between_plants : dp.plant.spacing_between_rows
        const otherGridPos = gridPositions.get(dp.planting.id)

        if (otherGridPos && otherGridPos.length > 0) {
          const otherMinRow = Math.min(...otherGridPos.map(p => p.row))
          const otherMinCol = Math.min(...otherGridPos.map(p => p.col))

          const otherCells = otherGridPos.map(pos => ({
            x: dp.position.x + (pos.col - otherMinCol) * otherBaseWidth,
            y: dp.position.y + (pos.row - otherMinRow) * otherBaseHeight,
            width: otherBaseWidth,
            height: otherBaseHeight,
          }))

          return currentCells.some(currentCell =>
            otherCells.some(otherCell => checkOverlap(currentCell, otherCell))
          )
        } else {
          const otherRect = getPlantRect(dp)
          return currentCells.some(currentCell => checkOverlap(currentCell, otherRect))
        }
      })
    } else {
      const currentRect = getPlantRect(currentPlant)

      return draggablePlants.some(dp => {
        if (dp.planting.id === plantingId) return false

        const otherBaseWidth = isRotated ? dp.plant.spacing_between_rows : dp.plant.spacing_between_plants
        const otherBaseHeight = isRotated ? dp.plant.spacing_between_plants : dp.plant.spacing_between_rows
        const otherGridPos = gridPositions.get(dp.planting.id)

        if (otherGridPos && otherGridPos.length > 0) {
          const otherMinRow = Math.min(...otherGridPos.map(p => p.row))
          const otherMinCol = Math.min(...otherGridPos.map(p => p.col))

          const otherCells = otherGridPos.map(pos => ({
            x: dp.position.x + (pos.col - otherMinCol) * otherBaseWidth,
            y: dp.position.y + (pos.row - otherMinRow) * otherBaseHeight,
            width: otherBaseWidth,
            height: otherBaseHeight,
          }))

          return otherCells.some(otherCell => checkOverlap(currentRect, otherCell))
        } else {
          const otherRect = getPlantRect(dp)
          return checkOverlap(currentRect, otherRect)
        }
      })
    }
  }

  const handleDoubleClick = (plantingId: string) => {
    const planting = plantings.find(p => p.id === plantingId)
    if (!planting) return

    const existingGrid = gridPositions.get(plantingId)
    if (!existingGrid) {
      const initialGrid: GridPosition[] = []
      for (let i = 0; i < planting.quantity; i++) {
        initialGrid.push({ row: 0, col: i })
      }
      setGridPositions(new Map(gridPositions).set(plantingId, initialGrid))
    }

    setEditingPlantingId(plantingId)
  }

  const handleSaveEdit = () => {
    setEditingPlantingId(null)
  }

  const handleSavePositions = async () => {
    setIsSaving(true)

    const individualPositions: IndividualPlantPosition[] = []
    gridPositions.forEach((gridPos, plantingId) => {
      gridPos.forEach((pos, index) => {
        individualPositions.push({
          planting_id: plantingId,
          index,
          x: pos.col,
          y: pos.row,
        })
      })
    })

    await savePositionsMutation.mutateAsync({
      positions,
      individual_positions: individualPositions.length > 0 ? individualPositions : undefined,
    })

    setIsSaving(false)
  }

  const handleCancelEdit = () => {
    if (editingPlantingId) {
      const newGridPositions = new Map(gridPositions)
      newGridPositions.delete(editingPlantingId)
      setGridPositions(newGridPositions)
    }
    setEditingPlantingId(null)
  }

  const handleMouseDown = (e: React.MouseEvent, plantingId: string) => {
    if (editingPlantingId) return
    const dp = draggablePlants.find(dp => dp.planting.id === plantingId)
    if (!dp) return

    setDraggedPlant(plantingId)
    setDragOffset({
      x: e.clientX - dp.position.x * scale,
      y: e.clientY - dp.position.y * scale,
    })
  }

  const handleEditMouseDown = (e: React.MouseEvent, index: number, currentRow: number, currentCol: number) => {
    e.stopPropagation()
    setDraggedGridIndex(index)
    setDragOffset({
      x: e.clientX - currentCol * EDIT_CELL_SIZE,
      y: e.clientY - currentRow * EDIT_CELL_SIZE,
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return

    if (draggedPlant) {
      const dp = draggablePlants.find(d => d.planting.id === draggedPlant)
      if (!dp) return

      const rect = getPlantRect(dp)
      const maxX = displayWidth - rect.width
      const maxY = displayHeight - rect.height

      const rawX = (e.clientX - dragOffset.x) / scale
      const rawY = (e.clientY - dragOffset.y) / scale

      const x = Math.round(Math.max(0, Math.min(rawX, maxX)) / 5) * 5
      const y = Math.round(Math.max(0, Math.min(rawY, maxY)) / 5) * 5

      setPositions(prev => prev.map(pos =>
        pos.planting_id === draggedPlant ? { ...pos, x, y } : pos
      ))
    }
  }

  const handleEditMouseMove = (e: React.MouseEvent) => {
    if (draggedGridIndex === null || !editingPlantingId) return

    const newCol = Math.round((e.clientX - dragOffset.x) / EDIT_CELL_SIZE)
    const newRow = Math.round((e.clientY - dragOffset.y) / EDIT_CELL_SIZE)

    const currentGrid = gridPositions.get(editingPlantingId) || []
    const isOccupied = currentGrid.some((pos, idx) =>
      idx !== draggedGridIndex && pos.row === newRow && pos.col === newCol
    )

    if (!isOccupied) {
      const newGrid = [...currentGrid]
      newGrid[draggedGridIndex] = { row: newRow, col: newCol }
      setGridPositions(new Map(gridPositions).set(editingPlantingId, newGrid))
    }
  }

  const handleMouseUp = () => {
    setDraggedPlant(null)
    setDraggedGridIndex(null)
  }

  const getPerimeterPath = (gridPos: GridPosition[]) => {
    if (gridPos.length === 0) return ''

    const occupied = new Set(gridPos.map(p => `${p.row},${p.col}`))
    const edges: { x1: number; y1: number; x2: number; y2: number }[] = []

    gridPos.forEach(({ row, col }) => {
      if (!occupied.has(`${row - 1},${col}`)) {
        edges.push({ x1: col, y1: row, x2: col + 1, y2: row })
      }
      if (!occupied.has(`${row + 1},${col}`)) {
        edges.push({ x1: col, y1: row + 1, x2: col + 1, y2: row + 1 })
      }
      if (!occupied.has(`${row},${col - 1}`)) {
        edges.push({ x1: col, y1: row, x2: col, y2: row + 1 })
      }
      if (!occupied.has(`${row},${col + 1}`)) {
        edges.push({ x1: col + 1, y1: row, x2: col + 1, y2: row + 1 })
      }
    })

    return edges
  }

  const anyOverlap = draggablePlants.some(dp => hasOverlap(dp.planting.id))

  const editingPlant = editingPlantingId
    ? draggablePlants.find(dp => dp.planting.id === editingPlantingId)
    : null

  if (onOverlapChange) {
    onOverlapChange(anyOverlap)
  }

  return (
    <div className="space-y-4 select-none">
      <div className="flex justify-end">
        <button
          onClick={handleSavePositions}
          disabled={isSaving || anyOverlap}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-semibold"
        >
          {isSaving ? 'Saving...' : 'Save Layout'}
        </button>
      </div>
      <div className="border border-gray-300 rounded-lg p-4 bg-white">
        <div className="mb-2 text-sm text-gray-600">
          Plot dimensions: {plotWidth}cm × {plotLength}cm{isRotated && ' (rotated for display)'}
        </div>
        <div
          ref={containerRef}
          className="relative bg-amber-50 border-2 border-amber-900 rounded"
          style={{
            width: `${visualWidth}px`,
            height: `${visualHeight}px`,
            cursor: draggedPlant ? 'grabbing' : 'default',
          }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {draggablePlants.map(dp => {
            if (editingPlantingId === dp.planting.id) return null

            const overlapping = hasOverlap(dp.planting.id)
            const rect = getPlantRect(dp)
            const baseWidth = isRotated ? dp.plant.spacing_between_rows : dp.plant.spacing_between_plants
            const baseHeight = isRotated ? dp.plant.spacing_between_plants : dp.plant.spacing_between_rows
            const gridPos = gridPositions.get(dp.planting.id)

            return (
              <div key={dp.planting.id}>
                {gridPos && gridPos.length > 0 ? (
                  <>
                    {gridPos.map((pos, idx) => {
                      const minRow = Math.min(...gridPos.map(p => p.row))
                      const minCol = Math.min(...gridPos.map(p => p.col))

                      return (
                        <div
                          key={idx}
                          className={`absolute rounded cursor-grab active:cursor-grabbing ${
                            overlapping 
                              ? 'bg-red-200 border-red-500' 
                              : 'bg-green-200 border-green-600'
                          }`}
                          style={{
                            left: `${(dp.position.x + (pos.col - minCol) * baseWidth) * scale}px`,
                            top: `${(dp.position.y + (pos.row - minRow) * baseHeight) * scale}px`,
                            width: `${baseWidth * scale}px`,
                            height: `${baseHeight * scale}px`,
                            border: 'none',
                          }}
                          onMouseDown={(e) => handleMouseDown(e, dp.planting.id)}
                          onDoubleClick={() => handleDoubleClick(dp.planting.id)}
                        />
                      )
                    })}
                    <svg
                      className="absolute pointer-events-none"
                      style={{
                        left: `${dp.position.x * scale}px`,
                        top: `${dp.position.y * scale}px`,
                        width: `${rect.width * scale}px`,
                        height: `${rect.height * scale}px`,
                      }}
                    >
                      {getPerimeterPath(gridPos).map((edge, i) => {
                        const minRow = Math.min(...gridPos.map(p => p.row))
                        const minCol = Math.min(...gridPos.map(p => p.col))

                        return (
                          <line
                            key={i}
                            x1={((edge.x1 - minCol) * baseWidth) * scale}
                            y1={((edge.y1 - minRow) * baseHeight) * scale}
                            x2={((edge.x2 - minCol) * baseWidth) * scale}
                            y2={((edge.y2 - minRow) * baseHeight) * scale}
                            stroke="#059669"
                            strokeWidth="3"
                          />
                        )
                      })}
                    </svg>
                  </>
                ) : (
                  <div
                    className={`absolute border-2 rounded cursor-grab active:cursor-grabbing flex items-center justify-center text-xs font-semibold ${
                      overlapping 
                        ? 'bg-red-200 border-red-500 text-red-900' 
                        : 'bg-green-200 border-green-600 text-green-900'
                    }`}
                    style={{
                        left: `${dp.position.x * scale}px`,
                        top: `${dp.position.y * scale}px`,
                        width: `${rect.width * scale}px`,
                        height: `${rect.height * scale}px`,
                    }}
                    onMouseDown={(e) => handleMouseDown(e, dp.planting.id)}
                    onDoubleClick={() => handleDoubleClick(dp.planting.id)}
                  >
                    <div className="text-center">
                      <div>{dp.plant.name}</div>
                      <div className="text-xs">×{dp.planting.quantity}</div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {editingPlantingId && editingPlant && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 z-50 select-none"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={handleCancelEdit}
        >
          <div
            className="bg-white rounded-lg shadow-xl p-6 max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                Arrange {editingPlant.plant.name} (×{editingPlant.planting.quantity})
              </h3>
              <p className="text-sm text-gray-600">Drag plants to create your desired layout. Plants must touch each other.</p>
            </div>

            <div
              ref={editContainerRef}
              className="relative bg-gray-100 border-2 border-gray-400 rounded mb-4"
              style={{
                width: '600px',
                height: '400px',
                cursor: draggedGridIndex !== null ? 'grabbing' : 'default',
              }}
              onMouseMove={handleEditMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {(() => {
                const gridPos = gridPositions.get(editingPlantingId) || []
                const minRow = gridPos.length > 0 ? Math.min(...gridPos.map(p => p.row)) : 0
                const maxRow = gridPos.length > 0 ? Math.max(...gridPos.map(p => p.row)) : 0
                const minCol = gridPos.length > 0 ? Math.min(...gridPos.map(p => p.col)) : 0
                const maxCol = gridPos.length > 0 ? Math.max(...gridPos.map(p => p.col)) : 0

                const offsetX = 300 - ((maxCol + minCol) / 2) * EDIT_CELL_SIZE
                const offsetY = 200 - ((maxRow + minRow) / 2) * EDIT_CELL_SIZE

                return (
                  <>
                    <svg className="absolute inset-0 pointer-events-none">
                      {getPerimeterPath(gridPos).map((edge, i) => (
                        <line
                          key={i}
                          x1={edge.x1 * EDIT_CELL_SIZE + offsetX}
                          y1={edge.y1 * EDIT_CELL_SIZE + offsetY}
                          x2={edge.x2 * EDIT_CELL_SIZE + offsetX}
                          y2={edge.y2 * EDIT_CELL_SIZE + offsetY}
                          stroke="#2563eb"
                          strokeWidth="4"
                        />
                      ))}
                    </svg>

                    {gridPos.map((pos, idx) => (
                      <div
                        key={idx}
                        className="absolute border-2 border-blue-600 bg-blue-200 rounded cursor-grab active:cursor-grabbing flex items-center justify-center text-xs font-semibold text-blue-900"
                        style={{
                          left: `${pos.col * EDIT_CELL_SIZE + offsetX}px`,
                          top: `${pos.row * EDIT_CELL_SIZE + offsetY}px`,
                          width: `${EDIT_CELL_SIZE}px`,
                          height: `${EDIT_CELL_SIZE}px`,
                        }}
                        onMouseDown={(e) => handleEditMouseDown(e, idx, pos.row, pos.col)}
                      >
                        #{idx + 1}
                      </div>
                    ))}
                  </>
                )
              })()}
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelEdit}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
              >
                Save Layout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
