import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const proxyConfig = {
  '/ws': {
    target: 'ws://127.0.0.1:8000',
    ws: true,
    changeOrigin: true,
    rewriteWsOrigin: true,
    configure: (proxy) => {
      proxy.on('error', (err) => {
        // Gracefully ignore normal websocket disconnects / resets
        if (err.code === 'ECONNRESET' || err.code === 'ECONNREFUSED') return;
        console.warn('[vite ws proxy error]', err.message);
      });
    },
  },
  '/api': {
    target: 'http://127.0.0.1:8000',
    changeOrigin: true,
  },
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
    proxy: proxyConfig,
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
    proxy: proxyConfig,
  },
})
