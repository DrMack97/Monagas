// Configuración de Capacitor (empaquetado nativo Android de la app del Operador).
//
// webDir debe coincidir con build.outDir de vite.config.ts ('dist').
// Antes decía 'web-build' — una carpeta que nunca existió — así que
// `cap sync` no tenía nada que copiar y ningún build nativo funcionó jamás
// (checklist Fase 6, #48).
import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.monagas.operator',
  appName: 'Monagas Operator',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
}

export default config
