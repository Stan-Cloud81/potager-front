export const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

export const formatDateFrench = (dateString: string): string => {
  const date = new Date(dateString)
  const today = new Date()
  const day = date.getDate()
  const monthNames = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
  const month = monthNames[date.getMonth()]
  const year = date.getFullYear()
  
  if (year === today.getFullYear()) {
    return `${day} ${month}`
  }
  return `${day} ${month} ${year}`
}
