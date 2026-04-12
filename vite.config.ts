import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    fs: {
      // Allow both the real path and any junction that points here
      allow: [
        path.resolve(__dirname),
        'C:/Reflow automations/Cursor gemini vibe coding folder/CRM Reflow',
      ],
    },
  },
})
