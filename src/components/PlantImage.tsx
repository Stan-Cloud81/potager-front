import { useState, useEffect } from 'react'
import { getAuthToken } from '../api/client'

type PlantImageProps = {
  plantId: string
  alt: string
  className?: string
}

export const PlantImage = ({ plantId, alt, className = '' }: PlantImageProps) => {
  const [imageSrc, setImageSrc] = useState<string>('')
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchImage = async () => {
      const token = getAuthToken()
      if (!token) {
        setError(true)
        return
      }

      try {
        const response = await fetch(`http://127.0.0.1:8080/api/v1/plants/${plantId}/image`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) {
          setError(true)
          return
        }

        const blob = await response.blob()
        const imageUrl = URL.createObjectURL(blob)
        setImageSrc(imageUrl)
      } catch (err) {
        setError(true)
      }
    }

    fetchImage()

    return () => {
      if (imageSrc) {
        URL.revokeObjectURL(imageSrc)
      }
    }
  }, [plantId])

  if (error) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`}>
        <span className="text-4xl">🌱</span>
      </div>
    )
  }

  if (!imageSrc) {
    return (
      <div className={`bg-gray-100 animate-pulse ${className}`}></div>
    )
  }

  return (
    <img 
      src={imageSrc} 
      alt={alt}
      className={className}
    />
  )
}
