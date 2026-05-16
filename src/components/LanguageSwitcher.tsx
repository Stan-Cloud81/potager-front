import { useLanguage } from '../contexts/LanguageContext'

export const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage()

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setLanguage('en')}
        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
          language === 'en'
            ? 'bg-green-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLanguage('fr')}
        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
          language === 'fr'
            ? 'bg-green-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        FR
      </button>
    </div>
  )
}
