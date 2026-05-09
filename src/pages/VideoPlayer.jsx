import { useEffect, useRef, useState } from 'react'
import Hls from 'hls.js'
import { HiExternalLink } from 'react-icons/hi'
import { MdCast, MdCastConnected } from 'react-icons/md'

// Override via VITE_CF_WORKER env var
const CF_WORKER = import.meta.env.VITE_CF_WORKER

class AranciaProxyLoader extends Hls.DefaultConfig.loader {
  load(context, config, callbacks) {
    const url = context.url
    const cdnM = url.match(/^https?:\/\/([a-z0-9]+\.arancialive\.com)(\/.*)?$/)
    if (cdnM && /\.m3u8(\?|$)/.test(cdnM[2] || '')) {
      context.url = `/arancialive-proxy/stream/${cdnM[1]}${cdnM[2] || '/'}`
      return super.load(context, config, callbacks)
    }
    const tsM = url.match(/^https?:\/\/((?:[a-z0-9]+\.)?arancialive\.com)(\/.*)?$/)
    if (tsM && /\.ts(\?|$)/.test(tsM[2] || '')) {
      context.url = `${CF_WORKER}/proxy/${tsM[1]}${tsM[2] || '/'}`
      return super.load(context, config, callbacks)
    }

    super.load(context, config, callbacks)
  }
}

export default function VideoPlayer({ streamUrl, className }) {
  const videoRef = useRef(null)
  const hlsRef = useRef(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  // chromecast
  const [castAvailable, setCastAvailable] = useState(false)
  const [isCasting, setIsCasting] = useState(false)

  useEffect(() => {
    const initCast = () => {
      if (!window.cast?.framework || !window.chrome?.cast) return
      try {
        const ctx = window.cast.framework.CastContext.getInstance()
        ctx.setOptions({
          receiverApplicationId: window.chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
          autoJoinPolicy: window.chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
        })
        ctx.addEventListener(
          window.cast.framework.CastContextEventType.SESSION_STATE_CHANGED,
          (e) => {
            const { SESSION_STARTED, SESSION_RESUMED } = window.cast.framework.SessionState
            setIsCasting(
              e.sessionState === SESSION_STARTED ||
              e.sessionState === SESSION_RESUMED
            )
          }
        )
        setCastAvailable(true)
      } catch (err) { console.warn('Cast init failed:', err) }
    }

    if (window.__castAvailable) {
      initCast()
    } else {
      window.addEventListener('castAvailable', initCast, { once: true })
    }
    return () => window.removeEventListener('castAvailable', initCast)
  }, [])

  const castStream = () => {
    if (!window.cast?.framework || !streamUrl) return
    // Chromecast receiver needs an absolute URL.
    const absUrl = streamUrl.startsWith('http')
      ? streamUrl
      : window.location.origin + streamUrl

    const ctx = window.cast.framework.CastContext.getInstance()

    const doLoad = (session) => {
      const mediaInfo = new window.chrome.cast.media.MediaInfo(absUrl, 'application/x-mpegURL')
      mediaInfo.streamType = window.chrome.cast.media.StreamType.BUFFERED
      const req = new window.chrome.cast.media.LoadRequest(mediaInfo)
      session.loadMedia(req).catch((err) => console.error('Cast media load failed:', err))
    }

    const current = ctx.getCurrentSession()
    if (current) {
      doLoad(current)
    } else {
      ctx.requestSession().then(() => {
        const session = ctx.getCurrentSession()
        if (session) doLoad(session)
      }).catch((err) => console.warn('Cast session request failed:', err))
    }
  }
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!streamUrl || !videoRef.current) return

    setError(null)
    setLoading(true)

    const video = videoRef.current

    // Detect whether this is a direct video file (mp4, webm, ogg, mov, etc.)
    // rather than an HLS manifest. If so, play it natively.
    const isDirectVideo = /\.(mp4|webm|ogg|mov|mkv|avi)(\?|$)/i.test(streamUrl)

    if (isDirectVideo) {
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null }
      video.src = streamUrl
      const onMeta = () => { setLoading(false); video.play().catch(() => {}) }
      const onErr = () => { setError('Impossibile riprodurre il video.'); setLoading(false) }
      video.addEventListener('loadedmetadata', onMeta)
      video.addEventListener('error', onErr)
      return () => {
        video.removeEventListener('loadedmetadata', onMeta)
        video.removeEventListener('error', onErr)
        video.src = ''
      }
    }

    if (Hls.isSupported()) {
      if (hlsRef.current) hlsRef.current.destroy()
      const hls = new Hls({
        enableWorker: true,
        loader: AranciaProxyLoader,
      })
      hlsRef.current = hls
      hls.loadSource(streamUrl)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLoading(false)
        video.play().catch(() => {})
      })
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          setError('Impossibile caricare lo stream. Prova ad aprirlo direttamente.')
          setLoading(false)
        }
      })
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl
      video.addEventListener('loadedmetadata', () => {
        setLoading(false)
        video.play().catch(() => {})
      })
      video.addEventListener('error', () => {
        setError('Impossibile riprodurre lo stream.')
        setLoading(false)
      })
    } else {
      setError('Il tuo browser non supporta HLS. Prova ad aprire lo stream direttamente.')
      setLoading(false)
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
  }, [streamUrl])

  return (
    <div className={className ?? 'relative w-full aspect-video bg-black rounded-xl overflow-hidden'}>
      {/* Chromecast button — shown only when Cast SDK found a device */}
      {castAvailable && !error && (
        <button
          onClick={castStream}
          title={isCasting ? 'In riproduzione su Chromecast' : 'Trasmetti su Chromecast'}
          className={`absolute top-3 right-3 z-20 p-2 rounded-lg backdrop-blur-sm transition-colors ${
            isCasting
              ? 'bg-blue-600/90 text-white'
              : 'bg-black/60 text-gray-300 hover:text-white hover:bg-black/80'
          }`}
        >
          {isCasting ? <MdCastConnected className="text-xl" /> : <MdCast className="text-xl" />}
        </button>
      )}

      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-10">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-400">Caricamento stream...</p>
        </div>
      )}

      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-10 px-6 text-center">
          <p className="text-gray-300 mb-4">{error}</p>
          <a
            href={streamUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            <HiExternalLink />
            Apri Stream
          </a>
        </div>
      ) : null}

      <video
        ref={videoRef}
        controls
        className="w-full h-full"
        playsInline
      />
    </div>
  )
}
