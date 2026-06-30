import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

<<<<<<<< HEAD:frontend/3-use-ref/vite.config.js
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
========
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': 'http://localhost:3000'
    }
  }
>>>>>>>> 794b9d52cdd383f1d2e3af56c8604ba87f28b037:paytm/frontend/vite.config.js
})
