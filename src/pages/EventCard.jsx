import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HiPlay } from 'react-icons/hi'

export default function EventCard({ event }) {
  const navigate = useNavigate()

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => navigate(`/eventi/${event.id}`)}
      className="relative w-full cursor-pointer group rounded-lg overflow-hidden bg-gray-800"
    >
      {/* Poster */}
      <div className="aspect-[2/3] relative overflow-hidden">
        {event.thumbnail ? (
          <img
            src={event.thumbnail}
            alt={event.titolo}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            loading="lazy"
            onError={e => {
              e.target.style.display = 'none'
              e.target.nextSibling && (e.target.nextSibling.style.display = 'flex')
            }}
          />
        ) : null}
        {/* Fallback */}
        <div className="hidden w-full h-full bg-gray-700 items-center justify-center text-4xl">🍊</div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
            <HiPlay className="text-white text-xl ml-0.5" />
          </div>
        </div>

        {/* Price badge */}
        <div className="absolute top-2 right-2">
          <span className="bg-orange-500/90 text-white text-xs px-2 py-0.5 rounded-full font-medium">
            {event.prezzo === '0' || event.prezzo === 'Gratis' ? 'Gratis' : event.prezzo}
          </span>
        </div>
      </div>

      {/* Title */}
      <div className="p-2">
        <p className="text-white text-xs font-medium line-clamp-2 leading-tight">{event.titolo}</p>
      </div>
    </motion.div>
  )
}
