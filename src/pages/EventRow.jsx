import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HiChevronRight } from 'react-icons/hi'
import EventCard from './EventCard'
import { fetchEvents } from '../api'

// Number of events to show in the home-page preview row.
// Matches the grid columns so the row is always full.
const PREVIEW_COUNT = 6

export default function EventRow({ categoryId, categoryLabel, categorySlug }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchEvents(categoryId)
      .then(data => {
        setEvents(data.eventi || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [categoryId])

  if (loading) {
    return (
      <div className="px-4 sm:px-6 md:px-10">
        <div className="h-6 w-40 bg-gray-800 rounded animate-pulse mb-3" />
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
          {[...Array(PREVIEW_COUNT)].map((_, i) => (
            <div key={i} className="aspect-[2/3] bg-gray-800 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (events.length === 0) return null

  const preview = events.slice(0, PREVIEW_COUNT)

  return (
    <div className="px-4 sm:px-6 md:px-10">
      {/* Row header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base sm:text-xl font-bold text-white">{categoryLabel}</h2>
        <button
          onClick={() => navigate(`/categorie/${categorySlug}`)}
          className="flex items-center gap-1 text-orange-400 hover:text-orange-300 text-xs sm:text-sm font-medium transition-colors"
        >
          Vedi Tutti <HiChevronRight />
        </button>
      </div>

      {/* Centered grid — exactly fills the row, no overflow */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
        {preview.map(event => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  )
}
