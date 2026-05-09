/**
 * Vercel serverless function, proxies /arancialive-proxy/* requests to
 * arancialive.com with correct headers.
 */

import https from 'node:https'
import { URL } from 'node:url'

const UPSTREAM_HOST  = 'www.arancialive.com'
const SUPABASE_HOST  = 'bbhmyqgktyvooccnhnvs.supabase.co' // where we host mezzani2024
const MAX_REDIRECTS  = 5
const CDN_HOST_RE    = /^(?:[a-z0-9]+\.arancialive\.com|[a-z0-9]+\.supabase\.co)$/

const ARANCIA_HEADERS = {
  'User-Agent':      'AranciaLiveApp/19 CFNetwork/3826.600.41 Darwin/24.6.0',
  Accept:            '*/*',
  'Accept-Language': 'it-IT,it;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  Connection:        'keep-alive',
}

const CDN_HEADERS = {
  'User-Agent': 'AranciaLiveApp/19 CFNetwork/3826.600.41 Darwin/24.6.0',
  Accept:       '*/*',
  Connection:   'keep-alive',
}

const SUPABASE_HEADERS = {
  'User-Agent': 'Mozilla/5.0',
  Accept:       '*/*',
  Connection:   'keep-alive',
}

const CF_WORKER = process.env.VITE_CF_WORKER

function fetchUpstream(urlStr, redirectsLeft, headers, rangeHeader, callback) {
  const parsed = new URL(urlStr)
  const reqHeaders = { ...headers, Host: parsed.hostname }

  if (rangeHeader) {
    reqHeaders['Range'] = rangeHeader
  }

  const options = {
    hostname:           parsed.hostname,
    port:               parsed.port || 443,
    path:               parsed.pathname + (parsed.search || ''),
    method:             'GET',
    headers:            reqHeaders,
    rejectUnauthorized: false,
  }

  const proxyReq = https.request(options, (proxyRes) => {
    const status   = proxyRes.statusCode ?? 0
    const location = proxyRes.headers['location']
    if (status >= 300 && status < 400 && location && redirectsLeft > 0) {
      proxyRes.resume()
      const nextUrl = location.startsWith('http')
        ? location
        : new URL(location, urlStr).toString()
      fetchUpstream(nextUrl, redirectsLeft - 1, headers, rangeHeader, callback)
      return
    }
    callback(null, proxyRes)
  })

  proxyReq.on('error', (err) => callback(err, null))
  proxyReq.end()
}

function rewriteM3u8(content, upstreamUrl) {
  const base     = new URL(upstreamUrl)
  const basePath = base.pathname.replace(/\/[^/]*$/, '')

  return content.split('\n').map(line => {
    const trimmed = line.trim()
    if (trimmed === '') return line

    if (trimmed.startsWith('#') && trimmed.includes('URI="')) {
      return line.replace(/URI="([^"]+)"/g, (_, uri) => `URI="${toProxyUrl(uri, base, basePath)}"`)
    }

    if (!trimmed.startsWith('#')) {
      return toProxyUrl(trimmed, base, basePath)
    }

    return line
  }).join('\n')
}

function toProxyUrl(uri, base, basePath) {
  let absolute
  if (/^https?:\/\//.test(uri)) {
    absolute = uri
  } else if (uri.startsWith('/')) {
    absolute = `https://${base.hostname}${uri}`
  } else {
    absolute = `https://${base.hostname}${basePath}/${uri}`
  }

  if (/^https?:\/\/bbhmyqgktyvooccnhnvs\.supabase\.co(\/|$)/.test(absolute)) {
    const supaUrl  = new URL(absolute)
    const subPath  = supaUrl.pathname + (supaUrl.search || '')
    if (/\.m3u8(\?|$)/.test(absolute)) {
      return `/arancialive-proxy/supabase${subPath}`
    }
    return `${CF_WORKER}/proxy/${SUPABASE_HOST}${subPath}`
  }

  if (!/^https?:\/\/[a-z0-9]+\.arancialive\.com(\/|$)/.test(absolute)) {
    return absolute
  }

  const m    = absolute.match(/^https?:\/\/([a-z0-9]+\.arancialive\.com)(\/.*)?$/)
  const host = m ? m[1] : null
  const path = m ? (m[2] || '/') : '/'

  if (/\.m3u8(\?|$)/.test(absolute)) {
    if (host) return `/arancialive-proxy/stream/${host}${path}`
    return absolute
  }

  if (host) return `${CF_WORKER}/proxy/${host}${path}`
  return absolute
}

export default function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Headers', '*')
    res.writeHead(204)
    res.end()
    return
  }

  const rawPath = Array.isArray(req.query.path)
    ? req.query.path.join('/')
    : req.query.path || ''

  const safePath = rawPath
    .split('/')
    .filter(seg => seg !== '..' && seg !== '.')
    .join('/')

  const parts = safePath.split('/')

  let upstreamUrl
  let isStream  = false
  let reqHeaders = ARANCIA_HEADERS

  if (parts[0] === 'stream' && parts.length >= 2) {
    const cdnHost = parts[1]
    if (!CDN_HOST_RE.test(cdnHost)) {
      res.setHeader('Content-Type', 'application/json')
      res.writeHead(400)
      res.end(JSON.stringify({ error: 'Invalid CDN host' }))
      return
    }
    const cdnPath = parts.length > 2 ? '/' + parts.slice(2).join('/') : '/'
    upstreamUrl  = `https://${cdnHost}${cdnPath}`
    isStream     = true
    reqHeaders   = CDN_HEADERS

  } else if (parts[0] === 'supabase') {
    const subPath = parts.length > 1 ? '/' + parts.slice(1).join('/') : '/'
    upstreamUrl   = `https://${SUPABASE_HOST}${subPath}`
    isStream      = true   // riusa la logica M3U8-rewrite
    reqHeaders    = SUPABASE_HEADERS

  } else {
    upstreamUrl = `https://${UPSTREAM_HOST}/${safePath}`
    reqHeaders  = ARANCIA_HEADERS
  }

  const rangeHeader = req.headers['range'] || null

  fetchUpstream(upstreamUrl, MAX_REDIRECTS, reqHeaders, rangeHeader, (err, proxyRes) => {
    if (err) {
      console.error('[proxy] upstream error:', err.message)
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'application/json')
        res.writeHead(502)
        res.end(JSON.stringify({ error: 'Bad Gateway', detail: err.message }))
      }
      return
    }

    const ct     = proxyRes.headers['content-type'] || ''
    const isM3u8 = isStream && (ct.includes('mpegurl') || upstreamUrl.includes('.m3u8'))

    if (isM3u8) {
      const chunks = []
      proxyRes.on('data', c => chunks.push(c))
      proxyRes.on('end', () => {
        try {
          const text     = Buffer.concat(chunks).toString('utf8')
          const rewritten = rewriteM3u8(text, upstreamUrl)
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.setHeader('Content-Type', 'application/x-mpegurl')
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
          res.setHeader('Accept-Ranges', 'bytes')
          res.writeHead(proxyRes.statusCode ?? 200)
          res.end(rewritten)
        } catch (e) {
          if (!res.headersSent) {
            res.setHeader('Content-Type', 'application/json')
            res.writeHead(502)
            res.end(JSON.stringify({ error: 'M3U8 processing failed' }))
          }
        }
      })
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Accept-Ranges', 'bytes')
      if (ct) res.setHeader('Content-Type', ct)

      const contentRange = proxyRes.headers['content-range']
      if (contentRange) res.setHeader('Content-Range', contentRange)

      if (!isStream) {
        const enc = proxyRes.headers['content-encoding']
        if (enc) res.setHeader('Content-Encoding', enc)
      }

      res.writeHead(proxyRes.statusCode ?? 502)
      proxyRes.pipe(res)
    }
  })
}
