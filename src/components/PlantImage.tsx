type PlantImageProps = {
  imageUrl?: string
  alt: string
  className?: string
  style?: React.CSSProperties
}

export const PlantImage = ({ imageUrl, alt, className = '', style }: PlantImageProps) => {

  if (!imageUrl) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`} style={style}>
        <span className="text-4xl">🌱</span>
      </div>
    )
  }

  return (
    <img 
      src={imageUrl} 
      alt={alt}
      className={className}
      style={style}
    />
  )
}
