import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import EventCard from './EventCard'
import { fetchEvents } from '../api'

export default function EventsGrid({ categoryId }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    fetchEvents(categoryId ?? null)
      .then(data => {
        setEvents(data.eventi || [])
        setLoading(false)
      })
      .catch(() => {
        setError('Errore nel caricamento dei contenuti')
        setLoading(false)
      })
  }, [categoryId])

  if (loading) {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="aspect-[2/3] bg-gray-800 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400 text-lg">{error}</p>
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400 text-lg">Nessun contenuto disponibile</p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4"
    >
      {events.map((event, i) => (
        <motion.div
          key={event.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.03 }}
        >
          <EventCard event={event} />
        </motion.div>
      ))}
    </motion.div>
  )
}
