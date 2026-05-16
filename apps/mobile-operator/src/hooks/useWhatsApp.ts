// TODO: Hook generador WhatsApp deeplink - Player 3 (Fullstack)
// Paso 1: Formatear mensaje con datos del pozo
// Paso 2: Crear URL wa.me con mensaje prellenado
// Paso 3: Abrir WhatsApp con Linking.openURL
// Prompt de implementación rápida:
// "Crear useWhatsApp con formatMessage, generateDeeplink, openWhatsApp"
// Entregable:
// - formatMessage(pozo, lectura) → string formateado
// - generateDeeplink(numero, mensaje) → URL
// - openWhatsApp(numero, mensaje) → abre app
import { Linking } from 'react-native'

export function useWhatsApp() {
  const formatMessage = (pozo: any, lectura: any) => {
    return `
Reporte de Pozo
Nombre: ${pozo.nombre}
BPH: ${lectura.bph}
BPD: ${lectura.bpd}
Netos: ${lectura.netos}
Qg: ${lectura.qg}
Fecha: ${new Date().toLocaleDateString()}
    `.trim()
  }

  const generateDeeplink = (numero: string, mensaje: string) => {
    const encoded = encodeURIComponent(mensaje)
    return `https://wa.me/${numero}?text=${encoded}`
  }

  const openWhatsApp = (numero: string, mensaje: string) => {
    const url = generateDeeplink(numero, mensaje)
    Linking.openURL(url).catch(() => {
      alert('WhatsApp no está instalado')
    })
  }

  return {
    formatMessage,
    generateDeeplink,
    openWhatsApp
  }
}
