import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { getMe } from '../api/auth'
import { useState } from 'react'
import { LanguageSwitcher } from './LanguageSwitcher'

type LayoutProps = {
  children: React.ReactNode
}

export const Layout = ({ children }: LayoutProps) => {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [showUserDropdown, setShowUserDropdown] = useState(false)

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
  })

  const username = user?.email?.split('@')[0] || 'User'

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-green-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-2xl font-bold">🌱 Potager</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  to="/plants"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium hover:text-green-200"
                >
                  Plants
                </Link>
                <Link
                  to="/plots"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium hover:text-green-200"
                >
                  Garden Plots
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4 relative">
              <LanguageSwitcher />
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 hover:bg-green-700 px-3 py-2 rounded-md"
              >
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center relative">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  {user?.is_admin && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                  )}
                </div>
                <span className="text-sm font-medium">{username}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showUserDropdown && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                  <button
                    onClick={() => {
                      handleLogout()
                      setShowUserDropdown(false)
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
      <main className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
