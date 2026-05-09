import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const ARANCIA_HEADERS = {
  'User-Agent': 'AranciaLiveApp/19 CFNetwork/3826.600.41 Darwin/24.6.0',
  'Accept': '*/*',
  'Accept-Language': 'it-IT,it;q=0.9',
  'Connection': 'keep-alive',
}

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    proxy: {
      '/arancialive-proxy': {
        target: 'https://arancialive.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/arancialive-proxy/, ''),
        headers: ARANCIA_HEADERS,
      },
    },
  },
})
