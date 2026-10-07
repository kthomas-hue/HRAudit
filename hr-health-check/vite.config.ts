import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { responsesApiPlugin } from './vite-plugin-responses-api.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), responsesApiPlugin()],
})
