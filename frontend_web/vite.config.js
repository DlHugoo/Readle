// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': { target: 'http://localhost:3000', changeOrigin: true },
      '/oauth2': { target: 'http://localhost:3000', changeOrigin: true },
      // Only these two exact paths for your flow:
      '/auth/microsoft/start': { target: 'http://localhost:3000', changeOrigin: true },
      '/auth/microsoft/callback': { target: 'http://localhost:3000', changeOrigin: true },
      // ❌ Do NOT add '/auth': ... (that would swallow /authCallback)
    }
  }
})