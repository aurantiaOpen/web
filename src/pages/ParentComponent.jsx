import { useState, useEffect, useRef } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { HiHome, HiViewGrid, HiSearch, HiChevronUp } from 'react-icons/hi'
import Sidebar from './Sidebar'

const mobileNavItems = [
  { icon: HiHome, label: 'Home', path: '/' },
  { icon: HiViewGrid, label: 'Categorie', path: '/categorie/tutti' },
  { icon: HiSearch, label: 'Cerca', path: '/cerca' },
]

export default function ParentComponent() {
  const [showScrollTop, setShowScrollTop] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const mainRef = useRef(null)

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    // Use 'instant' to override the CSS scroll-behavior:smooth and jump to top
    // immediately when navigating between pages.
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [location.pathname])

  return (
    <div className="flex min-h-screen bg-[#0a0c12]">
      <Sidebar />
      <main ref={mainRef} className="flex-1 ml-0 md:ml-[84px] pb-20 md:pb-0 min-h-screen">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>

        <footer className="hidden md:block text-center py-8 text-gray-600 text-sm mt-12">
          <span className="text-orange-500">🍊 aranciaOpen</span> — Tutti i diritti riservati
        </footer>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-gray-900/95 backdrop-blur-md border-t border-gray-800">
        <div className="flex items-center justify-around py-2">
          {mobileNavItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-1 px-4 py-2 transition-colors ${
                  isActive ? 'text-orange-500' : 'text-gray-400'
                }`}
              >
                <Icon className="text-xl" />
                <span className="text-xs">{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      {/* Scroll to top */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-20 right-6 z-50 bg-orange-500 hover:bg-orange-400 text-white p-3 rounded-full shadow-lg md:bottom-8 transition-colors"
          >
            <HiChevronUp className="text-xl" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
