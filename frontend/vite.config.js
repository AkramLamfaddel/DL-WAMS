import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Vite config:
 * - In Docker: frontend is served by nginx, which routes via Traefik — no proxy needed.
 * - In local dev (npm run dev): proxy routes API calls to the correct backend port
 *   so you don't need CORS headers and can use a single dev server URL.
 */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Auth service
      '/api/auth': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      // Gallery service
      '/gallery': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      },
      // AI service
      '/api/analyze': {
        target: 'http://localhost:8002',
        changeOrigin: true,
      },
      '/api/status': {
        target: 'http://localhost:8002',
        changeOrigin: true,
      },
      // Historique service
      '/api/history': {
        target: 'http://localhost:8003',
        changeOrigin: true,
      },
    },
  },
})
