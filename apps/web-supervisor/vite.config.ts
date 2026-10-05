// Configuración de Vite del panel de supervisión: plugin React, alias @core,
// puerto 5174 y build en dist/.
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

// Publica /firebase-messaging-sw.js (ver sw/firebase-messaging-sw.template.js
// para el porqué). Un service worker no puede leer import.meta.env, así que la
// configuración de Firebase del ambiente se escribe en el archivo al servirlo
// (dev) o emitirlo (build). Sin las variables (p. ej. el build del CI, que no
// tiene .env) no falla: queda con valores vacíos y el push simplemente no
// funcionaría en ese build — igual que el resto de la app sin configuración.
function firebaseMessagingSw(mode: string): Plugin {
  const env = loadEnv(mode, __dirname, 'VITE_')
  const plantilla = path.resolve(__dirname, 'sw/firebase-messaging-sw.template.js')
  const version: string = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, 'node_modules/firebase/package.json'), 'utf-8')
  ).version

  const config = JSON.stringify({
    apiKey: env.VITE_FIREBASE_API_KEY ?? '',
    projectId: env.VITE_FIREBASE_PROJECT_ID ?? '',
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
    appId: env.VITE_FIREBASE_APP_ID ?? '',
  })

  const generar = () => {
    const sw = fs
      .readFileSync(plantilla, 'utf-8')
      .replaceAll('__FIREBASE_VERSION__', version)
      .replaceAll('__FIREBASE_CONFIG__', config)
    // Si la plantilla gana un marcador nuevo y se olvida aquí, que el build falle
    // en vez de publicar un worker roto que solo se nota con un push real.
    const sinReemplazar = sw.match(/__FIREBASE_[A-Z_]+__/)
    if (sinReemplazar) throw new Error(`firebase-messaging-sw: marcador sin reemplazar ${sinReemplazar[0]}`)
    return sw
  }

  return {
    name: 'firebase-messaging-sw',
    configureServer(server) {
      server.middlewares.use('/firebase-messaging-sw.js', (_req, res) => {
        res.setHeader('Content-Type', 'application/javascript')
        res.setHeader('Cache-Control', 'no-cache')
        res.end(generar())
      })
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'firebase-messaging-sw.js', source: generar() })
    },
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), firebaseMessagingSw(mode)],
  resolve: {
    alias: {
      '@core': path.resolve(__dirname, '../../packages/core/src')
    }
  },
  server: {
    port: 5174,
    host: true // expone la IP de red local (Network) siempre
  },
  build: { outDir: 'dist' }
}))
