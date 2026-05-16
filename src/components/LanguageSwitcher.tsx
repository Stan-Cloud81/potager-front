import { useLanguage } from '../contexts/LanguageContext'

export const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage()

  return (
    <>
      <button
        onClick={() => setLanguage('en')}
        className={`flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
          language === 'en' ? 'bg-gray-50 font-medium' : 'text-gray-700'
        }`}
      >
        <span className="text-lg">🇬🇧</span>
        English
      </button>
      <button
        onClick={() => setLanguage('fr')}
        className={`flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
          language === 'fr' ? 'bg-gray-50 font-medium' : 'text-gray-700'
        }`}
      >
        <span className="text-lg">🇫🇷</span>
        Français
      </button>
    </>
  )
}
