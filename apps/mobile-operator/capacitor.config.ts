// TODO: Configuración de Capacitor para Android - Player 3 (Fullstack)
// Paso 1: Definir appId, appName, webDir
// Paso 2: Configurar android bundleId
// Entregable: cap add android y cap run android funcionan
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
