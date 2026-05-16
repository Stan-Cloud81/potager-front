import { useState, useRef, useEffect } from 'react'
import { Plant, Planting } from '../types'
import { updatePlantingPosition, updatePlantingSize } from '../api/plantings'
import { useMutation } from '@tanstack/react-query'
import { PlantImage } from './PlantImage'

type PlantPosition = {
  planting_id: string
  x: number
  y: number
}

type GardenPlotVisualProps = {
  plotId: string
  plotWidth: number
  plotLength: number
  plantings: Planting[]
  plants: Plant[]
  onOverlapChange?: (hasOverlap: boolean) => void
  onPlantingStatusChange?: (plantingId: string, status: 'planted') => void
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

type SizeFactor = {
  width_factor: number
  length_factor: number
}

const MAX_HEIGHT = 600
const EDIT_CELL_SIZE = 60

export const GardenPlotVisual = ({ plotWidth, plotLength, plantings, plants, onOverlapChange, onPlantingStatusChange }: GardenPlotVisualProps) => {
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
  const maxVisualWidth = Math.min(windowWidth * 0.85, 1200)
  const scaleByHeight = maxVisualHeight / displayHeight
  const scaleByWidth = maxVisualWidth / displayWidth
  const scale = Math.min(5, scaleByHeight, scaleByWidth)
  const visualWidth = displayWidth * scale
  const visualHeight = displayHeight * scale

  const [positions, setPositions] = useState<PlantPosition[]>(() => {
    return plantings.map((p, i) => ({
      planting_id: p.id,
      x: p.position_x !== undefined && p.position_x !== null 
        ? p.position_x 
        : Math.round((10 + (i % 3) * 30) / 5) * 5,
      y: p.position_y !== undefined && p.position_y !== null 
        ? p.position_y 
        : Math.round((10 + Math.floor(i / 3) * 30) / 5) * 5,
    }))
  })

  const [sizeFactors, setSizeFactors] = useState<Map<string, SizeFactor>>(() => {
    const initial = new Map<string, SizeFactor>()
    plantings.forEach((p) => {
      initial.set(p.id, {
        width_factor: p.width_factor ?? 1,
        length_factor: p.length_factor ?? 1,
      })
    })
    return initial
  })

  const [gridPositions, setGridPositions] = useState<Map<string, GridPosition[]>>(() => {
    const initialGridPositions = new Map<string, GridPosition[]>()
    plantings.forEach((planting) => {
      if (planting.individual_positions && planting.individual_positions.length > 0) {
        const gridPos = planting.individual_positions.map(pos => ({
          row: pos.y,
          col: pos.x,
        }))
        initialGridPositions.set(planting.id, gridPos)
      } else {
        const initialGrid: GridPosition[] = []
        for (let i = 0; i < planting.quantity; i++) {
          initialGrid.push({ row: 0, col: i })
        }
        initialGridPositions.set(planting.id, initialGrid)
      }
    })
    return initialGridPositions
  })

  useEffect(() => {
    setSizeFactors(prev => {
      const updated = new Map(prev)
      plantings.forEach((p) => {
        if (!updated.has(p.id)) {
          updated.set(p.id, {
            width_factor: p.width_factor ?? 1,
            length_factor: p.length_factor ?? 1,
          })
        }
      })
      return updated
    })
  }, [plantings])

  useEffect(() => {
    setGridPositions(prev => {
      const updated = new Map(prev)
      plantings.forEach((planting) => {
        const existing = updated.get(planting.id)
        
        if (planting.individual_positions && planting.individual_positions.length > 0 && planting.individual_positions.length === planting.quantity) {
          const gridPos = planting.individual_positions.map(pos => ({
            row: pos.y,
            col: pos.x,
          }))
          updated.set(planting.id, gridPos)
        } else if (existing && existing.length !== planting.quantity) {
          const newGrid: GridPosition[] = []
          for (let i = 0; i < planting.quantity; i++) {
            newGrid.push({ row: 0, col: i })
          }
          updated.set(planting.id, newGrid)
        } else if (!existing) {
          const initialGrid: GridPosition[] = []
          for (let i = 0; i < planting.quantity; i++) {
            initialGrid.push({ row: 0, col: i })
          }
          updated.set(planting.id, initialGrid)
        }
      })
      return updated
    })
  }, [plantings])

  const [isSaving, setIsSaving] = useState(false)

  const savePositionsMutation = useMutation({
    mutationFn: (data: { plantingId: string; position_x: number; position_y: number; individual_positions?: { x: number; y: number }[] }) =>
      updatePlantingPosition(data.plantingId, {
        position_x: data.position_x,
        position_y: data.position_y,
        individual_positions: data.individual_positions,
      }),
  })

  const saveSizeMutation = useMutation({
    mutationFn: (data: { plantingId: string; width_factor: number; length_factor: number }) =>
      updatePlantingSize(data.plantingId, {
        width_factor: data.width_factor,
        length_factor: data.length_factor,
      }),
  })

  const [editingPlantingId, setEditingPlantingId] = useState<string | null>(null)
  const [draggedPlant, setDraggedPlant] = useState<string | null>(null)
  const [draggedGridIndex, setDraggedGridIndex] = useState<number | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [resizingPlant, setResizingPlant] = useState<string | null>(null)
  const [resizeStart, setResizeStart] = useState<{ mouseX: number; mouseY: number; widthFactor: number; lengthFactor: number; baseWidth: number; baseHeight: number; gridCols: number; gridRows: number; corner: 'nw' | 'ne' | 'sw' | 'se'; initialX: number; initialY: number; initialWidth: number; initialHeight: number } | null>(null)
  const [hoveredPlant, setHoveredPlant] = useState<string | null>(null)
  const [draggedFromSidebar, setDraggedFromSidebar] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const editContainerRef = useRef<HTMLDivElement>(null)

  const plantingsWithPositions = plantings.filter(p => 
    p.status !== 'planned' && positions.some(pos => pos.planting_id === p.id)
  )
  const plannedPlantings = plantings.filter(p => p.status === 'planned')

  const draggablePlants: DraggablePlant[] = plantingsWithPositions.map(planting => {
    const plant = plants.find(p => p.id === planting.plant_id)!
    const position = positions.find(pos => pos.planting_id === planting.id) || { planting_id: planting.id, x: 0, y: 0 }
    return { planting, plant, position }
  }).filter(dp => dp.plant)

  const getPlantRect = (dp: DraggablePlant) => {
    const factors = sizeFactors.get(dp.planting.id) || { width_factor: 1, length_factor: 1 }
    const baseWidth = (isRotated ? dp.plant.spacing_between_rows : dp.plant.spacing_between_plants) * factors.width_factor
    const baseHeight = (isRotated ? dp.plant.spacing_between_plants : dp.plant.spacing_between_rows) * factors.length_factor

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

    const currentFactors = sizeFactors.get(plantingId) || { width_factor: 1, length_factor: 1 }
    const baseWidth = (isRotated ? currentPlant.plant.spacing_between_rows : currentPlant.plant.spacing_between_plants) * currentFactors.width_factor
    const baseHeight = (isRotated ? currentPlant.plant.spacing_between_plants : currentPlant.plant.spacing_between_rows) * currentFactors.length_factor
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

        const otherFactors = sizeFactors.get(dp.planting.id) || { width_factor: 1, length_factor: 1 }
        const otherBaseWidth = (isRotated ? dp.plant.spacing_between_rows : dp.plant.spacing_between_plants) * otherFactors.width_factor
        const otherBaseHeight = (isRotated ? dp.plant.spacing_between_plants : dp.plant.spacing_between_rows) * otherFactors.length_factor
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

        const otherFactors = sizeFactors.get(dp.planting.id) || { width_factor: 1, length_factor: 1 }
        const otherBaseWidth = (isRotated ? dp.plant.spacing_between_rows : dp.plant.spacing_between_plants) * otherFactors.width_factor
        const otherBaseHeight = (isRotated ? dp.plant.spacing_between_plants : dp.plant.spacing_between_rows) * otherFactors.length_factor
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

    try {
      for (const position of positions) {
        const planting = plantings.find(p => p.id === position.planting_id)
        if (planting?.status === 'planned' && onPlantingStatusChange) {
          onPlantingStatusChange(position.planting_id, 'planted')
        }

        const gridPos = gridPositions.get(position.planting_id)
        const individualPositions = gridPos?.map(pos => ({
          x: pos.col,
          y: pos.row,
        }))

        await savePositionsMutation.mutateAsync({
          plantingId: position.planting_id,
          position_x: Math.round(position.x),
          position_y: Math.round(position.y),
          individual_positions: individualPositions && individualPositions.length > 0 ? individualPositions : undefined,
        })

        const factors = sizeFactors.get(position.planting_id)
        if (factors) {
          await saveSizeMutation.mutateAsync({
            plantingId: position.planting_id,
            width_factor: factors.width_factor,
            length_factor: factors.length_factor,
          })
        }
      }
    } finally {
      setIsSaving(false)
    }
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

  const handleResizeMouseDown = (e: React.MouseEvent, plantingId: string, corner: 'nw' | 'ne' | 'sw' | 'se') => {
    e.stopPropagation()
    e.preventDefault()
    const dp = draggablePlants.find(d => d.planting.id === plantingId)
    if (!dp) return

    const factors = sizeFactors.get(plantingId) || { width_factor: 1, length_factor: 1 }
    const rawBaseWidth = isRotated ? dp.plant.spacing_between_rows : dp.plant.spacing_between_plants
    const rawBaseHeight = isRotated ? dp.plant.spacing_between_plants : dp.plant.spacing_between_rows

    const gridPos = gridPositions.get(plantingId)
    let gridCols = dp.planting.quantity
    let gridRows = 1
    if (gridPos && gridPos.length > 0) {
      const minRow = Math.min(...gridPos.map(p => p.row))
      const maxRow = Math.max(...gridPos.map(p => p.row))
      const minCol = Math.min(...gridPos.map(p => p.col))
      const maxCol = Math.max(...gridPos.map(p => p.col))
      gridCols = maxCol - minCol + 1
      gridRows = maxRow - minRow + 1
    }

    const rect = getPlantRect(dp)

    setResizingPlant(plantingId)
    setResizeStart({
      mouseX: e.clientX,
      mouseY: e.clientY,
      widthFactor: factors.width_factor,
      lengthFactor: factors.length_factor,
      baseWidth: rawBaseWidth,
      baseHeight: rawBaseHeight,
      gridCols,
      gridRows,
      corner,
      initialX: dp.position.x,
      initialY: dp.position.y,
      initialWidth: rect.width,
      initialHeight: rect.height,
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return

    if (resizingPlant && resizeStart) {
      const deltaX = (e.clientX - resizeStart.mouseX) / scale
      const deltaY = (e.clientY - resizeStart.mouseY) / scale

      let newWidthCm = resizeStart.initialWidth
      let newHeightCm = resizeStart.initialHeight
      let newX = resizeStart.initialX
      let newY = resizeStart.initialY

      switch (resizeStart.corner) {
        case 'se':
          newWidthCm = resizeStart.initialWidth + deltaX
          newHeightCm = resizeStart.initialHeight + deltaY
          break
        case 'sw':
          newWidthCm = resizeStart.initialWidth - deltaX
          newHeightCm = resizeStart.initialHeight + deltaY
          newX = resizeStart.initialX + deltaX
          break
        case 'ne':
          newWidthCm = resizeStart.initialWidth + deltaX
          newHeightCm = resizeStart.initialHeight - deltaY
          newY = resizeStart.initialY + deltaY
          break
        case 'nw':
          newWidthCm = resizeStart.initialWidth - deltaX
          newHeightCm = resizeStart.initialHeight - deltaY
          newX = resizeStart.initialX + deltaX
          newY = resizeStart.initialY + deltaY
          break
      }

      const minWidth = resizeStart.gridCols * resizeStart.baseWidth * 0.3
      const minHeight = resizeStart.gridRows * resizeStart.baseHeight * 0.3

      if (newWidthCm < minWidth) {
        if (resizeStart.corner === 'sw' || resizeStart.corner === 'nw') {
          newX = resizeStart.initialX + (resizeStart.initialWidth - minWidth)
        }
        newWidthCm = minWidth
      }

      if (newHeightCm < minHeight) {
        if (resizeStart.corner === 'ne' || resizeStart.corner === 'nw') {
          newY = resizeStart.initialY + (resizeStart.initialHeight - minHeight)
        }
        newHeightCm = minHeight
      }

      newX = Math.max(0, Math.min(newX, displayWidth - newWidthCm))
      newY = Math.max(0, Math.min(newY, displayHeight - newHeightCm))

      const newWidthFactor = Math.round((newWidthCm / (resizeStart.gridCols * resizeStart.baseWidth)) * 10) / 10
      const newLengthFactor = Math.round((newHeightCm / (resizeStart.gridRows * resizeStart.baseHeight)) * 10) / 10

      setPositions(prev => prev.map(pos =>
        pos.planting_id === resizingPlant ? { ...pos, x: Math.round(newX / 5) * 5, y: Math.round(newY / 5) * 5 } : pos
      ))

      setSizeFactors(prev => {
        const updated = new Map(prev)
        updated.set(resizingPlant, {
          width_factor: Math.max(0.3, newWidthFactor),
          length_factor: Math.max(0.3, newLengthFactor),
        })
        return updated
      })
      return
    }

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
    setResizingPlant(null)
    setResizeStart(null)
  }

  const getPerimeterPath = (gridPos: GridPosition[]): { x1: number; y1: number; x2: number; y2: number }[] => {
    if (gridPos.length === 0) return []

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

  const handleSidebarDragStart = (e: React.DragEvent, plantingId: string) => {
    setDraggedFromSidebar(plantingId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handlePlotDragOver = (e: React.DragEvent) => {
    if (draggedFromSidebar) {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
    }
  }

  const handlePlotDrop = (e: React.DragEvent) => {
    if (!draggedFromSidebar || !containerRef.current) return
    e.preventDefault()

    const rect = containerRef.current.getBoundingClientRect()
    const x = Math.round((e.clientX - rect.left) / scale / 5) * 5
    const y = Math.round((e.clientY - rect.top) / scale / 5) * 5

    const planting = plantings.find(p => p.id === draggedFromSidebar)
    
    setPositions(prev => {
      const existing = prev.find(p => p.planting_id === draggedFromSidebar)
      if (existing) {
        return prev.map(p => p.planting_id === draggedFromSidebar ? { ...p, x, y } : p)
      } else {
        return [...prev, { planting_id: draggedFromSidebar, x, y }]
      }
    })

    if (planting && !sizeFactors.has(draggedFromSidebar)) {
      setSizeFactors(prev => {
        const updated = new Map(prev)
        updated.set(draggedFromSidebar, {
          width_factor: planting.width_factor ?? 1,
          length_factor: planting.length_factor ?? 1,
        })
        return updated
      })
    }

    if (planting && !gridPositions.has(draggedFromSidebar)) {
      const initialGrid: GridPosition[] = []
      for (let i = 0; i < planting.quantity; i++) {
        initialGrid.push({ row: 0, col: i })
      }
      setGridPositions(prev => new Map(prev).set(draggedFromSidebar, initialGrid))
    }

    setDraggedFromSidebar(null)
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
        <div className="flex gap-4">
        <div className="relative inline-block">
          <div style={{ 
            position: 'relative',
            padding: '14px',
            width: `${visualWidth + 28}px`,
            height: `${visualHeight + 28}px`,
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '14px', height: '14px', background: '#4A3C2A', zIndex: 2 }} />
            <div style={{ position: 'absolute', top: 0, right: 0, width: '14px', height: '14px', background: '#4A3C2A', zIndex: 2 }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '14px', height: '14px', background: '#4A3C2A', zIndex: 2 }} />
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: '14px', height: '14px', background: '#4A3C2A', zIndex: 2 }} />
          
          <div style={{
            position: 'absolute',
            top: 0,
            left: '14px',
            right: '14px',
            height: '14px',
            background: `repeating-linear-gradient(90deg, #4A3C2A 0px, #4A3C2A ${visualWidth / 14 * 0.2}px, #5D4E37 ${visualWidth / 14 * 0.2}px, #5D4E37 ${visualWidth / 14}px)`,
            zIndex: 1
          }} />
          
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: '14px',
            right: '14px',
            height: '14px',
            background: `repeating-linear-gradient(90deg, #4A3C2A 0px, #4A3C2A ${visualWidth / 14 * 0.2}px, #5D4E37 ${visualWidth / 14 * 0.2}px, #5D4E37 ${visualWidth / 14}px)`,
            zIndex: 1
          }} />
          
          <div style={{
            position: 'absolute',
            left: 0,
            top: '14px',
            bottom: '14px',
            width: '14px',
            background: `repeating-linear-gradient(0deg, #4A3C2A 0px, #4A3C2A ${visualHeight / 14 * 0.25}px, #5D4E37 ${visualHeight / 14 * 0.25}px, #5D4E37 ${visualHeight / 14}px)`,
            zIndex: 1
          }} />
          
          <div style={{
            position: 'absolute',
            right: 0,
            top: '14px',
            bottom: '14px',
            width: '14px',
            background: `repeating-linear-gradient(180deg, #4A3C2A 0px, #4A3C2A ${visualHeight / 14 * 0.25}px, #5D4E37 ${visualHeight / 14 * 0.25}px, #5D4E37 ${visualHeight / 14}px)`,
            zIndex: 1
          }} />
          
          <div
            ref={containerRef}
            className="relative shadow-lg"
            style={{
              width: `${visualWidth}px`,
              height: `${visualHeight}px`,
              cursor: resizingPlant ? 'nwse-resize' : draggedPlant ? 'grabbing' : 'default',
              background: '#6B4423',
              backgroundImage: `
                radial-gradient(circle at 20% 30%, rgba(90, 60, 35, 0.3) 1px, transparent 1px),
                radial-gradient(circle at 80% 70%, rgba(90, 60, 35, 0.3) 1px, transparent 1px),
                radial-gradient(circle at 40% 80%, rgba(90, 60, 35, 0.4) 1px, transparent 1px),
                radial-gradient(circle at 60% 20%, rgba(90, 60, 35, 0.3) 1px, transparent 1px),
                linear-gradient(rgba(80, 50, 30, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(80, 50, 30, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px, 50px 50px, 45px 45px, 55px 55px, 20px 20px, 20px 20px',
              backgroundPosition: '0 0, 10px 10px, 20px 20px, 30px 30px, 0 0, 0 0',
              boxShadow: 'inset 0 0 20px rgba(0,0,0,0.3)',
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onDragOver={handlePlotDragOver}
            onDrop={handlePlotDrop}
          >
          {draggablePlants.map(dp => {
            if (editingPlantingId === dp.planting.id) return null

            const overlapping = hasOverlap(dp.planting.id)
            const rect = getPlantRect(dp)
            const factors = sizeFactors.get(dp.planting.id) || { width_factor: 1, length_factor: 1 }
            const isUndersized = factors.width_factor < 1 || factors.length_factor < 1
            const isModified = factors.width_factor !== 1 || factors.length_factor !== 1
            const baseWidth = (isRotated ? dp.plant.spacing_between_rows : dp.plant.spacing_between_plants) * factors.width_factor
            const baseHeight = (isRotated ? dp.plant.spacing_between_plants : dp.plant.spacing_between_rows) * factors.length_factor
            const gridPos = gridPositions.get(dp.planting.id)

            return (
              <div 
                key={dp.planting.id}
                onMouseEnter={() => setHoveredPlant(dp.planting.id)}
                onMouseLeave={() => setHoveredPlant(null)}
              >
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
                              : isUndersized
                                ? 'bg-amber-200 border-amber-500'
                                : 'bg-green-200 border-green-600'
                          }`}
                          style={{
                            left: `${(dp.position.x + (pos.col - minCol) * baseWidth) * scale}px`,
                            top: `${(dp.position.y + (pos.row - minRow) * baseHeight) * scale}px`,
                            width: `${baseWidth * scale}px`,
                            height: `${baseHeight * scale}px`,
                            border: 'none',
                            opacity: 0.3,
                          }}
                          onMouseDown={(e) => handleMouseDown(e, dp.planting.id)}
                          onDoubleClick={() => handleDoubleClick(dp.planting.id)}
                        />
                      )
                    })}
                    <div
                      className="absolute pointer-events-none flex flex-col items-center justify-center gap-1"
                      style={{
                        left: `${(dp.position.x + rect.width / 2) * scale}px`,
                        top: `${(dp.position.y + rect.height / 2) * scale}px`,
                        transform: 'translate(-50%, -50%)',
                        maxWidth: `${rect.width * scale * 0.9}px`,
                        maxHeight: `${rect.height * scale * 0.85}px`,
                      }}
                    >
                      <PlantImage
                        plantId={dp.plant.id}
                        alt={dp.plant.name}
                        className="rounded-full flex-shrink-0"
                        style={{
                          width: `${baseHeight * scale * 0.4}px`,
                          height: `${baseHeight * scale * 0.4}px`,
                          objectFit: 'cover',
                        }}
                      />
                      <div className="text-center flex-shrink min-w-0" style={{ maxWidth: '100%' }}>
                        <div className="font-bold truncate leading-tight" style={{ fontSize: '9px' }}>
                          {dp.plant.name}{dp.plant.variety ? ` - ${dp.plant.variety}` : ''}
                        </div>
                        <div className="font-semibold leading-tight" style={{ fontSize: '8px' }}>
                          ×{dp.planting.quantity}
                        </div>
                        {isModified && (
                          <div className={`${isUndersized ? 'text-amber-700' : 'text-blue-700'} leading-tight`} style={{ fontSize: '7px' }}>
                            {isUndersized ? '⚠ Reduced spacing' : '↔ Custom spacing'}
                          </div>
                        )}
                      </div>
                    </div>
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
                            stroke={isUndersized ? '#d97706' : isModified ? '#2563eb' : '#059669'}
                            strokeWidth="3"
                          />
                        )
                      })}
                    </svg>
                    {isModified && hoveredPlant === dp.planting.id && (
                      <button
                        className="absolute z-20 text-white text-xs px-2 py-1 rounded shadow-lg pointer-events-auto"
                        style={{
                          left: `${(dp.position.x + rect.width / 2) * scale}px`,
                          top: `${(dp.position.y + 4) * scale}px`,
                          transform: 'translate(-50%, 0)',
                          background: isUndersized ? '#d97706' : '#2563eb',
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSizeFactors(prev => {
                            const updated = new Map(prev)
                            updated.set(dp.planting.id, { width_factor: 1, length_factor: 1 })
                            return updated
                          })
                        }}
                      >
                        Reset Size
                      </button>
                    )}
                    {hoveredPlant === dp.planting.id && (
                      <>
                        <div
                          className="absolute cursor-nwse-resize z-10"
                          style={{
                            left: `${dp.position.x * scale - 8}px`,
                            top: `${dp.position.y * scale - 8}px`,
                            width: '16px',
                            height: '16px',
                            background: isUndersized ? '#d97706' : isModified ? '#2563eb' : '#059669',
                            borderRadius: '3px',
                            border: '2px solid white',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                          }}
                          onMouseDown={(e) => handleResizeMouseDown(e, dp.planting.id, 'nw')}
                        />
                        <div
                          className="absolute cursor-nesw-resize z-10"
                          style={{
                            left: `${(dp.position.x + rect.width) * scale - 8}px`,
                            top: `${dp.position.y * scale - 8}px`,
                            width: '16px',
                            height: '16px',
                            background: isUndersized ? '#d97706' : isModified ? '#2563eb' : '#059669',
                            borderRadius: '3px',
                            border: '2px solid white',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                          }}
                          onMouseDown={(e) => handleResizeMouseDown(e, dp.planting.id, 'ne')}
                        />
                        <div
                          className="absolute cursor-nesw-resize z-10"
                          style={{
                            left: `${dp.position.x * scale - 8}px`,
                            top: `${(dp.position.y + rect.height) * scale - 8}px`,
                            width: '16px',
                            height: '16px',
                            background: isUndersized ? '#d97706' : isModified ? '#2563eb' : '#059669',
                            borderRadius: '3px',
                            border: '2px solid white',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                          }}
                          onMouseDown={(e) => handleResizeMouseDown(e, dp.planting.id, 'sw')}
                        />
                        <div
                          className="absolute cursor-nwse-resize z-10"
                          style={{
                            left: `${(dp.position.x + rect.width) * scale - 8}px`,
                            top: `${(dp.position.y + rect.height) * scale - 8}px`,
                            width: '16px',
                            height: '16px',
                            background: isUndersized ? '#d97706' : isModified ? '#2563eb' : '#059669',
                            borderRadius: '3px',
                            border: '2px solid white',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                          }}
                          onMouseDown={(e) => handleResizeMouseDown(e, dp.planting.id, 'se')}
                        />
                      </>
                    )}
                  </>
                ) : (
                  <div
                    className={`absolute border-2 rounded cursor-grab active:cursor-grabbing flex items-center justify-center text-xs font-semibold ${
                      overlapping 
                        ? 'bg-red-200 border-red-500 text-red-900' 
                        : isUndersized
                          ? 'bg-amber-200 border-amber-500 text-amber-900'
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
                      {isModified && (
                        <div className={isUndersized ? 'text-amber-700' : 'text-blue-700'} style={{ fontSize: '8px' }}>
                          {isUndersized ? '⚠ Reduced spacing' : '↔ Custom spacing'}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {!(gridPos && gridPos.length > 0) && isModified && hoveredPlant === dp.planting.id && (
                  <button
                    className="absolute z-20 text-white text-xs px-2 py-1 rounded shadow-lg pointer-events-auto"
                    style={{
                      left: `${(dp.position.x + rect.width / 2) * scale}px`,
                      top: `${(dp.position.y + 4) * scale}px`,
                      transform: 'translate(-50%, 0)',
                      background: isUndersized ? '#d97706' : '#2563eb',
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      setSizeFactors(prev => {
                        const updated = new Map(prev)
                        updated.set(dp.planting.id, { width_factor: 1, length_factor: 1 })
                        return updated
                      })
                    }}
                  >
                    Reset Size
                  </button>
                )}
                {!(gridPos && gridPos.length > 0) && hoveredPlant === dp.planting.id && (
                  <>
                    <div
                      className="absolute cursor-nwse-resize z-10"
                      style={{
                        left: `${dp.position.x * scale - 8}px`,
                        top: `${dp.position.y * scale - 8}px`,
                        width: '16px',
                        height: '16px',
                        background: isUndersized ? '#d97706' : '#059669',
                        borderRadius: '3px',
                        border: '2px solid white',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                      }}
                      onMouseDown={(e) => handleResizeMouseDown(e, dp.planting.id, 'nw')}
                    />
                    <div
                      className="absolute cursor-nesw-resize z-10"
                      style={{
                        left: `${(dp.position.x + rect.width) * scale - 8}px`,
                        top: `${dp.position.y * scale - 8}px`,
                        width: '16px',
                        height: '16px',
                        background: isUndersized ? '#d97706' : '#059669',
                        borderRadius: '3px',
                        border: '2px solid white',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                      }}
                      onMouseDown={(e) => handleResizeMouseDown(e, dp.planting.id, 'ne')}
                    />
                    <div
                      className="absolute cursor-nesw-resize z-10"
                      style={{
                        left: `${dp.position.x * scale - 8}px`,
                        top: `${(dp.position.y + rect.height) * scale - 8}px`,
                        width: '16px',
                        height: '16px',
                        background: isUndersized ? '#d97706' : '#059669',
                        borderRadius: '3px',
                        border: '2px solid white',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                      }}
                      onMouseDown={(e) => handleResizeMouseDown(e, dp.planting.id, 'sw')}
                    />
                    <div
                      className="absolute cursor-nwse-resize z-10"
                      style={{
                        left: `${(dp.position.x + rect.width) * scale - 8}px`,
                        top: `${(dp.position.y + rect.height) * scale - 8}px`,
                        width: '16px',
                        height: '16px',
                        background: isUndersized ? '#d97706' : '#059669',
                        borderRadius: '3px',
                        border: '2px solid white',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                      }}
                      onMouseDown={(e) => handleResizeMouseDown(e, dp.planting.id, 'se')}
                    />
                  </>
                )}
              </div>
            )
          })}
          </div>
          </div>
        </div>

        {plannedPlantings.length > 0 && (
          <div 
            className="bg-gray-50 border-2 border-gray-300 rounded-lg p-3 overflow-y-auto flex-shrink-0"
            style={{ 
              width: '280px',
              maxHeight: `${visualHeight + 28}px`
            }}
          >
            <h3 className="text-sm font-bold text-gray-700 mb-3 sticky top-0 bg-gray-50 pb-2">
              Planned Plants ({plannedPlantings.length})
            </h3>
            <div className="space-y-2">
              {plannedPlantings.map(planting => {
                const plant = plants.find(p => p.id === planting.plant_id)
                if (!plant) return null

                return (
                  <div
                    key={planting.id}
                    draggable
                    onDragStart={(e) => handleSidebarDragStart(e, planting.id)}
                    className="bg-white border border-gray-300 rounded-lg p-2 cursor-move hover:shadow-md hover:border-green-400 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <PlantImage
                        plantId={plant.id}
                        alt={plant.name}
                        className="w-12 h-12 object-contain rounded flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-gray-900 truncate">
                          {plant.name}
                        </div>
                        <div className="text-xs text-gray-600 truncate">
                          {plant.variety}
                        </div>
                        <div className="text-xs text-gray-500">
                          Qty: {planting.quantity}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
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
