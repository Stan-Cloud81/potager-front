type MonthIndicatorProps = {
  label: string
  months: number[]
  color?: 'green' | 'red'
}

export const MonthIndicator = ({ label, months, color = 'green' }: MonthIndicatorProps) => {
  const monthNames = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']
  const bgColor = color === 'green' ? 'bg-green-700' : 'bg-red-700'
  const textColor = color === 'green' ? 'text-green-700' : 'text-red-700'

  return (
    <div>
      <span className={`text-xs font-medium ${textColor}`}>{label}</span>
      <div className="flex gap-0.5">
        {monthNames.map((month, index) => (
          <div
            key={index}
            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium ${
              months.includes(index + 1)
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
