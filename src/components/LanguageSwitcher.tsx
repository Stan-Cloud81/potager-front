import { useState } from 'react'
import { useLanguage } from '../contexts/LanguageContext'

export const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage()
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false)

  const languages = {
    en: { flag: '🇬🇧', name: 'English' },
    fr: { flag: '🇫🇷', name: 'Français' }
  }

  const currentLanguage = languages[language]

  return (
    <div className="relative">
      <button
        onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
        className="flex items-center justify-between gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{currentLanguage.flag}</span>
          <span>{currentLanguage.name}</span>
        </div>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {showLanguageDropdown && (
        <div className="absolute left-full top-0 ml-1 w-40 bg-white rounded-md shadow-lg py-1 z-20">
          <button
            onClick={() => {
              setLanguage('en')
              setShowLanguageDropdown(false)
            }}
            className={`flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
              language === 'en' ? 'bg-gray-50 font-medium' : 'text-gray-700'
            }`}
          >
            <span className="text-lg">🇬🇧</span>
            English
          </button>
          <button
            onClick={() => {
              setLanguage('fr')
              setShowLanguageDropdown(false)
            }}
            className={`flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
              language === 'fr' ? 'bg-gray-50 font-medium' : 'text-gray-700'
            }`}
          >
            <span className="text-lg">🇫🇷</span>
            Français
          </button>
        </div>
      )}
    </div>
  )
}
