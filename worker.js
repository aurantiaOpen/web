/**
 * CORS proxy for ts segments
 */

const CDN_HOST_RE     = /^(www|[a-z0-9]+)\.arancialive\.com$/
const SUPABASE_HOST   = 'bbhmyqgktyvooccnhnvs.supabase.co' // where we host mezzani2024

const ARANCIA_HEADERS = {
  'User-Agent': 'AranciaLiveApp/19 CFNetwork/3826.600.41 Darwin/24.6.0',
  Accept:       '*/*',
  Connection:   'keep-alive',
}

const SUPABASE_HEADERS = {
  'User-Agent': 'Mozilla/5.0',
  Accept:       '*/*',
  Connection:   'keep-alive',
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Max-Age':       '86400',
}

const PASSTHROUGH_HEADERS = [
  'content-type',
  'content-length',
  'content-range',
  'accept-ranges',
  'last-modified',
  'etag',
  'cache-control',
]

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS })
    }

    const match = url.pathname.match(/^\/proxy\/([^/]+)(\/.*)?$/)
    if (!match) {
      return new Response(JSON.stringify({ error: 'Bad request — use /proxy/<host>/<path>' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      })
    }

    const cdnHost = match[1]
    const cdnPath = match[2] || '/'
    const isSupabase = cdnHost === SUPABASE_HOST

    // whitelist
    if (!CDN_HOST_RE.test(cdnHost) && !isSupabase) {
      return new Response(JSON.stringify({ error: 'Host non consentito' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      })
    }

    const upstreamUrl = `https://${cdnHost}${cdnPath}${url.search}`
    const reqHeaders  = { ...(isSupabase ? SUPABASE_HEADERS : ARANCIA_HEADERS) }
    const range       = request.headers.get('Range')
    if (range) reqHeaders['Range'] = range

    let upstreamRes
    try {
      upstreamRes = await fetch(upstreamUrl, {
        method:   'GET',
        headers:  reqHeaders,
        redirect: 'follow',
      })
    } catch (err) {
      return new Response(JSON.stringify({ error: 'Upstream fetch failed', detail: err.message }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      })
    }

    const resHeaders = new Headers(CORS_HEADERS)
    for (const h of PASSTHROUGH_HEADERS) {
      const val = upstreamRes.headers.get(h)
      if (val) resHeaders.set(h, val)
    }
    resHeaders.set('Accept-Ranges', 'bytes')

    return new Response(upstreamRes.body, {
      status:  upstreamRes.status,
      headers: resHeaders,
    })
  },
}
