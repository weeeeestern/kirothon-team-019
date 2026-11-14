import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import type { Connect } from 'vite'
import { handleRequest } from '../server/transit.mjs'
import { handleLiveRequest } from '../server/live.mjs'

export default defineConfig(({ mode }) => {
  // Load private variables only into Node middleware. Do not expose them through define/envPrefix.
  const env = { ...loadEnv(mode, new URL('..', import.meta.url).pathname, ''), ...loadEnv(mode, new URL('.', import.meta.url).pathname, '') }
  const serveApi: Connect.NextHandleFunction = (req, res, next) => {
    void handleRequest(req, res, env)
      .then(handled => handled || handleLiveRequest(req, res, env))
      .then(handled => { if (!handled) next() }).catch(next)
  }
  return {
  plugins: [react(), {
    name: 'jamjam-transit-api',
    configureServer(server) {
      server.middlewares.use(serveApi)
    },
    configurePreviewServer(server) {
      server.middlewares.use(serveApi)
    },
  }],
  resolve: {
    alias: {
      '@': new URL('.', import.meta.url).pathname,
    },
  },
  }
})
