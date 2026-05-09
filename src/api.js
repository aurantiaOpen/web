const PROXY_PREFIX = '/arancialive-proxy'
const MEDIA_BASE = 'https://www.arancialive.com'
// public device ID hardcoded in the official app (from decompiled APK), see api
const LONGSTRING = import.meta.env.VITE_LONGSTRING || 'xhCxVPXwUCVpKiD3lArm2ILNc7BRdDrb'

function apiUrl(path) {
  return `${PROXY_PREFIX}/api/app/1/${LONGSTRING}${path}`
}

function thumbnailUrl(path) {
  if (!path) return null
  if (path.startsWith('http')) return path
  return `${MEDIA_BASE}${path}`
}

const CF_WORKER = import.meta.env.VITE_CF_WORKER
function streamProxyUrl(url) {
  if (!url) return null
  const m = url.match(/^https?:\/\/([a-z0-9]+\.arancialive\.com)(\/.*)?$/)
  if (m) {
    if (m[2]?.includes('.m3u8')) {
      return `${PROXY_PREFIX}/stream/${m[1]}${m[2] || '/'}`
    }
    return `${CF_WORKER}/proxy/${m[1]}${m[2] || '/'}`
  }
  const supabaseM = url.match(/^https?:\/\/([a-z0-9]+\.supabase\.co)(\/.*\.m3u8(?:\?.*)?)$/)
  if (supabaseM) {
    return `${PROXY_PREFIX}/stream/${supabaseM[1]}${supabaseM[2] || '/'}`
  }
  return url
}

function priceLabel(idTariffa) {
  return idTariffa === 0 ? 'Gratis' : `€${idTariffa}`
}

// ficed m3u8 playlists for mezzani 2024, since they messed up them
const MEZZANI_BASE = 'https://bbhmyqgktyvooccnhnvs.supabase.co/storage/v1/object/public/m3u8'
const MEZZANI_EVENT_ID = 123
const MEZZANI_EPISODES = [
  { video_id: 'mezzani-sfilata',  titolo: 'Sfilata',                       durata: '52 min', data: '2024-05-19', stream_url: streamProxyUrl(`${MEZZANI_BASE}/ceri_sfilata_fix.m3u8`),  thumbnail: 'https://www.arancialive.com/media/v/2024/5/123_638517278166892696_156.jpg' },
  { video_id: 'mezzani-alzata',   titolo: 'Alzata',                        durata: '45 min', data: '2024-05-19', stream_url: streamProxyUrl(`${MEZZANI_BASE}/ceri_alzata_fix.m3u8`),   thumbnail: 'https://www.arancialive.com/media/v/2024/5/123_638517278706746461_703.jpg' },
  { video_id: 'mezzani-corso',    titolo: 'Calata e Corso Garibaldi',      durata: '28 min', data: '2024-05-19', stream_url: streamProxyUrl(`${MEZZANI_BASE}/ceri_corso_fix.m3u8`),    thumbnail: 'https://www.arancialive.com/media/v/2024/5/123_638517541592704867_412.jpg' },
  { video_id: 'mezzani-ferranti', titolo: 'Calata dei Ferranti e S.Martino', durata: '18 min', data: '2024-05-19', stream_url: streamProxyUrl(`${MEZZANI_BASE}/ceri_ferranti_fix.m3u8`), thumbnail: 'https://www.arancialive.com/media/v/2024/5/123_638517542012252835_690.jpg' },
  { video_id: 'mezzani-gsera',    titolo: 'Girate della sera e buchetto',  durata: '19 min', data: '2024-05-19', stream_url: streamProxyUrl(`${MEZZANI_BASE}/ceri_gsera_fix.m3u8`),    thumbnail: 'https://www.arancialive.com/media/v/2024/5/123_638517542429288134_423.jpg' },
  { video_id: 'mezzani-monte',    titolo: 'Monte',                         durata: '45 min', data: '2024-05-19', stream_url: streamProxyUrl(`${MEZZANI_BASE}/ceri_monte_fix.m3u8`),    thumbnail: 'https://www.arancialive.com/media/v/2024/5/123_638517573079246822_776.jpg' },
]

function transformEvent(item, categoryName) {
  const info = item.liveinfo || {}
  return {
    id: info.IDEVENTO ?? item.IDEVENTO,
    titolo: info.Nome || '',
    thumbnail: thumbnailUrl(info.CopertinaUrl),
    prezzo: priceLabel(info.IDTARIFFA ?? item.IDTARIFFA ?? 0),
    descrizione: info.Descrizione || '',
    categoria: categoryName,
    // IDCATEGORIA lives inside liveinfo in the API response
    categoriaId: info.IDCATEGORIA ?? item.IDCATEGORIA,
  }
}

async function fetchOndemandSuddivisi() {
  const res = await fetch(apiUrl('/ondemandSuddivisi'))
  if (!res.ok) throw new Error('Failed to fetch ondemand')
  return res.json()
}

export async function fetchEvents(catId) {
  const data = await fetchOndemandSuddivisi()
  const seen = new Set()
  const eventi = []
  for (const group of data) {
    for (const item of group.ListaEventiOndemand || []) {
      const id = item.liveinfo?.IDEVENTO ?? item.IDEVENTO
      // IDCATEGORIA lives inside liveinfo
      const catItemId = item.liveinfo?.IDCATEGORIA ?? item.IDCATEGORIA
      if (seen.has(id)) continue
      if (catId != null && catItemId !== catId) continue
      seen.add(id)
      eventi.push(transformEvent(item, group.nomeCategoria))
    }
  }
  return { eventi }
}

export async function fetchEventById(id) {
  const numId = Number(id)
  const [ondemandData, videosRes] = await Promise.all([
    fetchOndemandSuddivisi(),
    fetch(apiUrl(`/ondemand/video/${id}/1`)),
  ])

  let eventInfo = null
  for (const group of ondemandData) {
    for (const item of group.ListaEventiOndemand || []) {
      if ((item.liveinfo?.IDEVENTO ?? item.IDEVENTO) === numId) {
        eventInfo = transformEvent(item, group.nomeCategoria)
        break
      }
    }
    if (eventInfo) break
  }

  if (!eventInfo) throw new Error('Event not found')

  // mezzani 2024
  if (numId === MEZZANI_EVENT_ID) {
    return {
      ...eventInfo,
      episodes: MEZZANI_EPISODES,
      stream_url: MEZZANI_EPISODES[0].stream_url,
    }
  }

  const videos = videosRes.ok ? await videosRes.json() : []
  const episodes = (Array.isArray(videos) ? videos : []).map(v => ({
    video_id: v.IDVIDEO,
    titolo: v.Nome || '',
    thumbnail: thumbnailUrl(v.CopertinaUrl),
    durata: v.Durata ? `${v.Durata} min` : null,
    data: v.Data ? v.Data.split('T')[0] : null,
    stream_url: streamProxyUrl(v.VideoUrl),
  }))

  return {
    ...eventInfo,
    episodes: episodes.length > 1 ? episodes : [],
    stream_url: episodes.length > 0 ? episodes[0].stream_url : null,
  }
}
