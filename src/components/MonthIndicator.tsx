type MonthIndicatorProps = {
  label: string
  months?: number[] | string[]
  color?: 'green' | 'red'
}

const monthNameToNumber: Record<string, number> = {
  'Janvier': 1, 'janvier': 1,
  'Février': 2, 'février': 2, 'Fevrier': 2, 'fevrier': 2,
  'Mars': 3, 'mars': 3,
  'Avril': 4, 'avril': 4,
  'Mai': 5, 'mai': 5,
  'Juin': 6, 'juin': 6,
  'Juillet': 7, 'juillet': 7,
  'Août': 8, 'août': 8, 'Aout': 8, 'aout': 8,
  'Septembre': 9, 'septembre': 9,
  'Octobre': 10, 'octobre': 10,
  'Novembre': 11, 'novembre': 11,
  'Décembre': 12, 'décembre': 12, 'Decembre': 12, 'decembre': 12,
}

export const MonthIndicator = ({ label, months, color = 'green' }: MonthIndicatorProps) => {
  const monthNames = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']
  const bgColor = color === 'green' ? 'bg-green-700' : 'bg-red-700'
  const textColor = color === 'green' ? 'text-green-700' : 'text-red-700'

  const monthNumbers = months?.map(m => {
    if (typeof m === 'number') return m
    return monthNameToNumber[m] || 0
  }).filter(n => n > 0) || []

  return (
    <div>
      <span className={`text-xs font-medium ${textColor}`}>{label}</span>
      <div className="flex gap-0.5">
        {monthNames.map((month, index) => (
          <div
            key={index}
            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium ${
              monthNumbers.includes(index + 1)
                ? `${bgColor} text-white`
                : 'bg-gray-200 text-gray-500'
            }`}
          >
            {month}
          </div>
        ))}
      </div>
    </div>
  )
}
