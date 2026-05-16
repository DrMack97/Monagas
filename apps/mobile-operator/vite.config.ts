// TODO: Configuración de Vite para mobile-operator - Player 3 (Fullstack)
// Paso 1: Configurar plugin react, alias @core
// Paso 2: Definir server port, build outDir
// Entregable: vite dev lanza en localhost:5173
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
  server: { port: 5173 },
  build: { outDir: 'dist' }
})
