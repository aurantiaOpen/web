import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { HiPlay, HiInformationCircle, HiChevronLeft, HiChevronRight } from 'react-icons/hi'
import { fetchEvents } from '../api'

export default function HeroBanner() {
  const [events, setEvents] = useState([])
  const [current, setCurrent] = useState(0)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const timerRef = useRef(null)
  const touchStartX = useRef(null)

  useEffect(() => {
    fetchEvents()
      .then(data => {
        setEvents((data.eventi || []).slice(0, 6))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (events.length === 0) return
    timerRef.current = setInterval(() => {
      setCurrent(c => (c + 1) % events.length)
    }, 6000)
    return () => clearInterval(timerRef.current)
  }, [events])

  const go = (dir) => {
    clearInterval(timerRef.current)
    setCurrent(c => (c + dir + events.length) % events.length)
  }

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 40) go(diff > 0 ? 1 : -1)
    touchStartX.current = null
  }

  if (loading) {
    return (
      <div className="w-full h-[40vh] sm:h-[50vh] md:h-[70vh] bg-gray-900 animate-pulse flex items-center justify-center">
        <span className="text-orange-500 text-2xl">🍊</span>
      </div>
    )
  }

  if (events.length === 0) return null

  const event = events[current]

  return (
    <div
      className="relative w-full h-[40vh] sm:h-[50vh] md:h-[70vh] min-h-[280px] overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={event.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
          {/* Blurred background fill — covers the full area regardless of image aspect ratio */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${event.thumbnail})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center top',
              filter: 'blur(20px)',
              transform: 'scale(1.12)',
            }}
          />
          {/* Dim the blurred fill so text stays readable */}
          <div className="absolute inset-0 bg-[#0a0c12]/50" />
          {/* Mobile/tablet: letterboxed (object-contain). Desktop: full-width fill (object-cover). */}
          <img
            src={event.thumbnail}
            alt={event.titolo}
            className="absolute inset-0 w-full h-full object-contain md:object-cover object-center md:object-top"
            onError={e => { e.target.style.display = 'none' }}
          />
          {/* Gradients for readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0c12] via-[#0a0c12]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c12] via-transparent to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end px-5 pb-14 sm:px-8 sm:pb-14 md:pb-12 md:px-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={`content-${event.id}`}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl"
          >
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-2 md:mb-3 text-white leading-tight line-clamp-2">
              {event.titolo}
            </h1>
            <div className="flex items-center gap-3 mb-4 md:mb-5">
              <span className="bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-xs sm:text-sm font-medium border border-orange-500/30">
                {event.prezzo === '0' || event.prezzo === 'Gratis' ? 'Gratis' : event.prezzo}
              </span>
            </div>
            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={() => navigate(`/eventi/${event.id}`)}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base transition-colors"
              >
                <HiPlay className="text-lg sm:text-xl" />
                Guarda
              </button>
              <button
                onClick={() => navigate(`/eventi/${event.id}`)}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base backdrop-blur-sm transition-colors"
              >
                <HiInformationCircle className="text-lg sm:text-xl" />
                Dettagli
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation arrows — hidden on small mobile to avoid cluttering */}
      <button
        onClick={() => go(-1)}
        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-1.5 sm:p-2 rounded-full backdrop-blur-sm transition-colors"
      >
        <HiChevronLeft className="text-lg sm:text-xl" />
      </button>
      <button
        onClick={() => go(1)}
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-1.5 sm:p-2 rounded-full backdrop-blur-sm transition-colors"
      >
        <HiChevronRight className="text-lg sm:text-xl" />
      </button>

      {/* Pills / progress dots */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5 sm:gap-2">
        {events.map((_, i) => (
          <button
            key={i}
            onClick={() => { clearInterval(timerRef.current); setCurrent(i) }}
            className={`rounded-full transition-all ${
              i === current ? 'w-6 sm:w-8 h-1.5 sm:h-2 bg-orange-500' : 'w-1.5 sm:w-2 h-1.5 sm:h-2 bg-white/40 hover:bg-white/70'
            }`}
          />
        ))}
      </div>

      {/* Thumbnail strip — desktop only */}
      <div className="absolute bottom-12 right-8 hidden lg:flex gap-2">
        {events.map((e, i) => (
          <button
            key={e.id}
            onClick={() => { clearInterval(timerRef.current); setCurrent(i) }}
            className={`w-16 h-10 rounded overflow-hidden border-2 transition-all ${
              i === current ? 'border-orange-500 opacity-100' : 'border-transparent opacity-50 hover:opacity-80'
            }`}
          >
            <img src={e.thumbnail} alt="" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  )
}
