import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HiSearch, HiX } from 'react-icons/hi'
import EventCard from './EventCard'
import { fetchEvents } from '../api'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [allEvents, setAllEvents] = useState([])
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
    fetchEvents()
      .then(data => {
        setAllEvents(data.eventi || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }
    const q = query.toLowerCase()
    setResults(allEvents.filter(e => e.titolo.toLowerCase().includes(q)))
  }, [query, allEvents])

  return (
    <div className="min-h-screen px-6 md:px-10 py-8">
      <h1 className="text-3xl font-bold text-white mb-8">Cerca</h1>

      {/* Search input */}
      <div className="relative max-w-xl mb-10">
        <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Cerca un evento..."
          className="w-full bg-gray-800 text-white placeholder-gray-500 pl-12 pr-12 py-4 rounded-xl border border-gray-700 focus:border-orange-500 focus:outline-none transition-colors text-lg"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
          >
            <HiX className="text-xl" />
          </button>
        )}
      </div>

      {/* Results */}
      <AnimatePresence mode="wait">
        {query.trim() === '' ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-gray-400 text-lg">Inizia a digitare per cercare</p>
          </motion.div>
        ) : results.length === 0 ? (
          <motion.div
            key="no-results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="text-6xl mb-4">😕</div>
            <p className="text-gray-400 text-lg">Nessun risultato per &quot;{query}&quot;</p>
          </motion.div>
        ) : (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-gray-400 mb-6">{results.length} risultati per &quot;{query}&quot;</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {results.map((event, i) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <EventCard event={event} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
