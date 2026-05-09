/**
 * Production proxy server.
 * - Serves the built app from ./dist
 * - Proxies /arancialive-proxy/* -> https://www.arancialive.com/*
 *   with the required app headers (including User-Agent spoofing).
 * - Proxies /arancialive-proxy/stream/{host}/{path} -> https://{host}/{path}
 *   (CDN media, with m3u8 URL rewriting for CORS-free HLS playback)
 */

import http from 'node:http'
import https from 'node:https'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { URL } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST = path.join(__dirname, 'dist')
const PORT = Number(process.env.PORT) || 3000
const PROXY_PREFIX = '/arancialive-proxy'
const UPSTREAM_HOST = 'www.arancialive.com'
const MAX_REDIRECTS = 5
const STREAM_HOST_RE = /^(?:[a-z0-9]+\.arancialive\.com|[a-z0-9]+\.supabase\.co)$/

const ARANCIA_HEADERS = {
  'User-Agent': 'AranciaLiveApp/19 CFNetwork/3826.600.41 Darwin/24.6.0',
  'Accept': '*/*',
  'Accept-Language': 'it-IT,it;q=0.9',
  'Connection': 'keep-alive',
  'Accept-Encoding': 'gzip, deflate, br',
}

// cdn requests: omit Accept-Encoding so m3u8 arrives as plain text
const CDN_HEADERS = {
  'User-Agent': 'AranciaLiveApp/19 CFNetwork/3826.600.41 Darwin/24.6.0',
  'Accept': '*/*',
  'Connection': 'keep-alive',
}

const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

function fetchUpstream(urlStr, method, redirectsLeft, headers, callback) {
  const parsed = new URL(urlStr)
  const options = {
    hostname: parsed.hostname,
    port: parsed.port || 443,
    path: parsed.pathname + (parsed.search || ''),
    method,
    headers: { ...headers, Host: parsed.hostname },
    // The upstream server has an expired TLS certificate; bypass verification
    // since we are the sole consumer of this fixed, known host.
    rejectUnauthorized: false,
  }

  const proxyReq = https.request(options, (proxyRes) => {
    const status = proxyRes.statusCode ?? 0
    const location = proxyRes.headers['location']
    if (status >= 300 && status < 400 && location && redirectsLeft > 0) {
      proxyRes.resume()
      const nextUrl = location.startsWith('http')
        ? location
        : new URL(location, urlStr).toString()
      fetchUpstream(nextUrl, 'GET', redirectsLeft - 1, headers, callback)
      return
    }
    callback(null, proxyRes)
  })

  proxyReq.on('error', (err) => callback(err, null))
  proxyReq.end()
}

// Rewrite segment/sub-playlist URIs in an m3u8 manifest so that hls.js
// fetches them via this proxy instead of directly from the CDN (CORS).
function rewriteM3u8(content, upstreamUrl) {
  const base = new URL(upstreamUrl)
  const basePath = base.pathname.replace(/\/[^/]*$/, '')

  return content.split('\n').map(line => {
    const trimmed = line.trim()
    if (trimmed === '') return line

    // rewrite URI= in tag attributes
    if (trimmed.startsWith('#') && trimmed.includes('URI="')) {
      return line.replace(/URI="([^"]+)"/g, (_, uri) => `URI="${toProxyUrl(uri, base, basePath)}"`)
    }

    // plain URI lines (not comment/directive)
    if (!trimmed.startsWith('#')) {
      return toProxyUrl(trimmed, base, basePath)
    }

    return line
  }).join('\n')
}

function toProxyUrl(uri, base, basePath) {
  if (/^https?:\/\//.test(uri)) {
    const m = uri.match(/^https?:\/\/([a-z0-9]+\.arancialive\.com)(\/.*)?$/)
    if (m) return `/arancialive-proxy/stream/${m[1]}${m[2] || '/'}`
    return uri
  }
  if (uri.startsWith('/')) {
    return `/arancialive-proxy/stream/${base.hostname}${uri}`
  }
  return `/arancialive-proxy/stream/${base.hostname}${basePath}/${uri}`
}

function proxyRequest(req, res) {
  const rawPath = req.url.slice(PROXY_PREFIX.length) || '/'
  const safePath = rawPath
    .split('/')
    .filter(seg => seg !== '..' && seg !== '.')
    .join('/')
  const parts = safePath.split('/').filter(Boolean)

  let upstreamUrl
  let isStream = false

  if (parts[0] === 'stream' && parts.length >= 2) {
    const cdnHost = parts[1]
    if (!STREAM_HOST_RE.test(cdnHost)) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Invalid stream host' }))
      return
    }
    const cdnPath = parts.length > 2 ? '/' + parts.slice(2).join('/') : '/'
    upstreamUrl = `https://${cdnHost}${cdnPath}`
    isStream = true
  } else {
    upstreamUrl = `https://${UPSTREAM_HOST}${rawPath}`
  }

  fetchUpstream(upstreamUrl, req.method, MAX_REDIRECTS, isStream ? CDN_HEADERS : ARANCIA_HEADERS, (err, proxyRes) => {
    if (err) {
      console.error('Proxy error:', err.message)
      if (!res.headersSent) {
        res.writeHead(502)
        res.end('Bad Gateway')
      }
      return
    }

    const ct = proxyRes.headers['content-type'] || ''
    const isM3u8 = isStream && (ct.includes('mpegurl') || upstreamUrl.includes('.m3u8'))

    if (isM3u8) {
      const chunks = []
      proxyRes.on('data', c => chunks.push(c))
      proxyRes.on('end', () => {
        try {
          const text = Buffer.concat(chunks).toString('utf8')
          const rewritten = rewriteM3u8(text, upstreamUrl)
          res.writeHead(proxyRes.statusCode ?? 200, {
            'Content-Type': 'application/x-mpegurl',
            'Access-Control-Allow-Origin': '*',
          })
          res.end(rewritten)
        } catch (e) {
          if (!res.headersSent) {
            res.writeHead(502)
            res.end('M3U8 processing failed')
          }
        }
      })
    } else {
      res.writeHead(proxyRes.statusCode, {
        'Content-Type': ct || 'application/json',
        'Access-Control-Allow-Origin': '*',
      })
      proxyRes.pipe(res)
    }
  })
}

function serveStatic(req, res) {
  let filePath = path.join(DIST, req.url === '/' ? 'index.html' : req.url)

  if (!fs.existsSync(filePath)) {
    // spa fallback
    filePath = path.join(DIST, 'index.html')
  }

  const ext = path.extname(filePath)
  const contentType = MIME[ext] || 'application/octet-stream'

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404)
      res.end('Not Found')
      return
    }
    res.writeHead(200, { 'Content-Type': contentType })
    res.end(data)
  })
}

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' })
    res.end()
    return
  }

  if (req.url.startsWith(PROXY_PREFIX)) {
    proxyRequest(req, res)
  } else {
    serveStatic(req, res)
  }
})

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log(`Proxying ${PROXY_PREFIX}/* -> https://${UPSTREAM_HOST}/*`)
})
