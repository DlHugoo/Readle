// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
server: {
  proxy: {
    '/api': { target: 'http://ec2-3-25-81-177.ap-southeast-2.compute.amazonaws.com:3000', changeOrigin: true },
    '/oauth2': { target: 'http://ec2-3-25-81-177.ap-southeast-2.compute.amazonaws.com:3000', changeOrigin: true },
    '/auth/microsoft/start': { target: 'http://ec2-3-25-81-177.ap-southeast-2.compute.amazonaws.com:3000', changeOrigin: true },
    '/auth/microsoft/callback': { target: 'http://ec2-3-25-81-177.ap-southeast-2.compute.amazonaws.com:3000', changeOrigin: true },
    // Dictionary API proxy to avoid CORS issues
    '/dictionary-api': {
      target: 'https://api.dictionaryapi.dev',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/dictionary-api/, ''),
      secure: true
    }
  }
}

})