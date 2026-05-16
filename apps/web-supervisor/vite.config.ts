// TODO: Configuración de Vite para web-supervisor - Player 3 (Fullstack)
// Paso 1: Configurar plugin react, alias @core
// Paso 2: Definir server port 5174, build outDir
// Entregable: vite dev lanza en localhost:5174
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@core': path.resolve(__dirname, '../../packages/core/src')
    }
  },
  server: { port: 5174 },
  build: { outDir: 'dist' }
})
