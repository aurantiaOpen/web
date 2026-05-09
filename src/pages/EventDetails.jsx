import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { HiChevronLeft, HiPlay, HiClock, HiCalendar, HiTag, HiX } from 'react-icons/hi'
import VideoPlayer from './VideoPlayer'
import { fetchEventById } from '../api'

export default function EventDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [streamUrl, setStreamUrl] = useState(null)
  const [selectedEpisode, setSelectedEpisode] = useState(null)
  const [showPlayer, setShowPlayer] = useState(false)

  useEffect(() => {
    fetchEventById(id)
      .then(data => {
        setEvent(data)
        setLoading(false)
      })
      .catch(() => {
        setError('Evento non trovato')
        setLoading(false)
      })
  }, [id])

  // Prevent body scroll while fullscreen player is open
  useEffect(() => {
    document.body.style.overflow = showPlayer ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [showPlayer])

  const playMain = () => {
    setSelectedEpisode(null)
    setStreamUrl(event?.stream_url || null)
    setShowPlayer(true)
  }

  const playEpisode = (ep) => {
    setSelectedEpisode(ep)
    setStreamUrl(ep.stream_url || null)
    setShowPlayer(true)
  }

  const closePlayer = () => {
    setShowPlayer(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400 text-xl">{error || 'Evento non trovato'}</p>
        <button onClick={() => navigate(-1)} className="text-orange-500 hover:text-orange-400">
          ← Torna indietro
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Fullscreen video modal */}
      <AnimatePresence>
        {showPlayer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[100] bg-black flex flex-col"
          >
            {/* Header bar */}
            <div className="flex items-center gap-3 px-4 py-3 bg-black/70 border-b border-gray-800/60 flex-shrink-0">
              <button
                onClick={closePlayer}
                className="text-white hover:text-orange-400 p-1 rounded-full transition-colors"
                aria-label="Chiudi"
              >
                <HiX className="text-2xl" />
              </button>
              <p className="text-white text-sm font-medium truncate">
                {selectedEpisode?.titolo || event.titolo}
              </p>
            </div>

            {/* Player — fills remaining height, centered */}
            <div className="flex-1 flex items-center justify-center bg-black">
              {streamUrl ? (
                <VideoPlayer
                  streamUrl={streamUrl}
                  className="relative w-full aspect-video bg-black max-h-full"
                />
              ) : (
                <p className="text-gray-400 text-lg">Stream non disponibile</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero backdrop */}
      <div className="relative h-[40vh] sm:h-[50vh] min-h-[240px] overflow-hidden">
        <img
          src={event.thumbnail}
          alt={event.titolo}
          className="w-full h-full object-cover"
          onError={e => { e.target.style.display = 'none' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c12] via-[#0a0c12]/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0c12]/80 to-transparent" />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 bg-black/40 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-sm transition-colors"
        >
          <HiChevronLeft className="text-xl" />
        </button>
      </div>

      {/* Details */}
      <div className="px-4 sm:px-6 md:px-10 -mt-16 sm:-mt-20 relative z-10 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl"
        >
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold text-white mb-3 md:mb-4">{event.titolo}</h1>

          <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 md:mb-6">
            {event.categoria && (
              <span className="flex items-center gap-1 bg-gray-800 text-gray-300 px-3 py-1 rounded-full text-xs sm:text-sm">
                <HiTag className="text-orange-400" />
                {event.categoria}
              </span>
            )}
            <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
              {event.prezzo === '0' || event.prezzo === 'Gratis' ? 'Gratis' : event.prezzo}
            </span>
          </div>

          {event.descrizione && (
            <p className="text-gray-300 text-sm sm:text-base leading-relaxed mb-6 md:mb-8 max-w-2xl">{event.descrizione}</p>
          )}

          {/* Main play button — shown when there are no multi-episode list */}
          {(!event.episodes || event.episodes.length === 0) && (
            <button
              onClick={playMain}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white px-6 py-3 rounded-lg font-semibold text-base sm:text-lg transition-colors mb-6 md:mb-8"
            >
              <HiPlay className="text-xl sm:text-2xl" />
              Guarda Ora
            </button>
          )}

          {/* Episodes */}
          {event.episodes && event.episodes.length > 0 && (
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">Episodi</h2>
              <div className="space-y-2 sm:space-y-3">
                {event.episodes.map((ep, i) => (
                  <motion.div
                    key={ep.video_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => playEpisode(ep)}
                    className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl cursor-pointer transition-colors group bg-gray-800/60 hover:bg-gray-800 border border-transparent hover:border-orange-500/30"
                  >
                    {/* Episode thumbnail */}
                    <div className="relative flex-shrink-0 w-20 sm:w-28 h-12 sm:h-16 rounded-lg overflow-hidden bg-gray-700">
                      {ep.thumbnail && (
                        <img
                          src={ep.thumbnail}
                          alt={ep.titolo}
                          className="w-full h-full object-cover"
                          onError={e => { e.target.style.display = 'none' }}
                        />
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                        <HiPlay className="text-white text-xl sm:text-2xl" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm sm:text-base font-medium truncate">{ep.titolo}</p>
                      <div className="flex items-center gap-2 sm:gap-3 mt-1 text-xs sm:text-sm text-gray-400">
                        {ep.durata && (
                          <span className="flex items-center gap-1">
                            <HiClock className="text-orange-400" />
                            {ep.durata}
                          </span>
                        )}
                        {ep.data && (
                          <span className="flex items-center gap-1">
                            <HiCalendar className="text-orange-400" />
                            {ep.data}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-gray-700 group-hover:bg-orange-500 transition-colors">
                      <HiPlay className="text-white ml-0.5" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
