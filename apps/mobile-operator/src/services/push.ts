// src/services/push.ts
//
// Notificaciones push NATIVAS (FCM vía @capacitor/push-notifications) para el
// APK del Operador. Reemplaza al flujo anterior basado en la API Notification
// del navegador + firebase/messaging + clave VAPID, que NO funciona dentro del
// WebView de Android que empaqueta Capacitor (checklist Fase 6, #47).
//
// Qué resuelve, además del cambio de mecanismo:
//  - El token FCM se guarda en usuarios/{uid}.fcmToken (campo que las reglas
//    permiten escribir a cada usuario sobre SU documento y nada más) para que
//    notifyOperator.ts pueda avisarle cuando su evaluación se aprueba/rechaza.
//  - Se crea el canal "evaluaciones": notifyOperator.ts manda
//    android.notification.channelId = 'evaluaciones'; sin el canal creado en
//    el dispositivo, Android 8+ cae al canal genérico.
//  - Al cerrar sesión se borra el token del usuario: si no, el siguiente que
//    inicie sesión en ese mismo teléfono dejaría al anterior recibiendo los
//    avisos del nuevo.
//
// Todo está aislado aquí (y no en un hook) porque los listeners del plugin son
// globales: registrarlos desde cada componente los duplicaría.

import { Capacitor } from '@capacitor/core'
import { PushNotifications, type PushNotificationSchema } from '@capacitor/push-notifications'
import { Preferences } from '@capacitor/preferences'
import { doc, updateDoc, deleteField } from 'firebase/firestore'
import { auth, db } from './firebase'

export const CANAL_EVALUACIONES = 'evaluaciones'
const CLAVE_PREFERENCIA = 'notificaciones'

export type ResultadoActivacion = 'activadas' | 'denegadas' | 'no-soportado'

type Oyente = (n: PushNotificationSchema) => void
const oyentes = new Set<Oyente>()
let listenersListos = false

/** Solo el APK/iOS nativo — en un navegador no hay push (ver cabecera). */
export function pushSoportado(): boolean {
  return Capacitor.isNativePlatform()
}

async function guardarToken(token: string | null): Promise<void> {
  const user = auth.currentUser
  if (!user) return
  // Payload EXACTO: firestore.rules solo deja a un usuario tocar su propio
  // campo fcmToken en /usuarios/{uid} — ninguna otra clave (ni siquiera sin
  // cambiar de valor), o se rechaza toda la escritura.
  await updateDoc(doc(db, 'usuarios', user.uid), { fcmToken: token ?? deleteField() })
}

async function prepararListeners(): Promise<void> {
  if (listenersListos) return
  listenersListos = true
  // 'registration' también se dispara cuando FCM rota el token.
  await PushNotifications.addListener('registration', (t) => {
    guardarToken(t.value).catch((err) => console.error('No se pudo guardar el token FCM:', err))
  })
  await PushNotifications.addListener('registrationError', (e) => {
    console.error('Error registrando el dispositivo en FCM:', e.error)
  })
  // Con la app en primer plano Android NO muestra la notificación solo.
  await PushNotifications.addListener('pushNotificationReceived', (n) => {
    oyentes.forEach((cb) => cb(n))
  })
}

/** Avisos recibidos con la app abierta. Devuelve la función para desuscribirse. */
export function suscribirRecibidas(cb: Oyente): () => void {
  oyentes.add(cb)
  return () => {
    oyentes.delete(cb)
  }
}

/** Pide permiso (si hace falta), crea el canal y registra el dispositivo en FCM. */
export async function activarPush(): Promise<ResultadoActivacion> {
  if (!pushSoportado()) return 'no-soportado'

  let estado = (await PushNotifications.checkPermissions()).receive
  if (estado === 'prompt' || estado === 'prompt-with-rationale') {
    estado = (await PushNotifications.requestPermissions()).receive
  }
  if (estado !== 'granted') return 'denegadas'

  await prepararListeners()
  await PushNotifications.createChannel({
    id: CANAL_EVALUACIONES,
    name: 'Evaluaciones',
    description: 'Avisos cuando un supervisor aprueba o rechaza tu evaluación',
    importance: 4, // IMPORTANCE_HIGH: con sonido y aviso emergente
    visibility: 1,
  })
  await PushNotifications.register()
  return 'activadas'
}

/** Quita el token del usuario y da de baja el dispositivo (interruptor "apagado"). */
export async function desactivarPush(): Promise<void> {
  if (!pushSoportado()) return
  await guardarToken(null)
  await PushNotifications.unregister()
}

export const TOPE_LIMPIEZA_MS = 3000

/**
 * Para llamar justo ANTES de cerrar sesión (auth.currentUser aún existe).
 * Nunca debe impedir ni retrasar el cierre de sesión: sin conexión, el
 * updateDoc de Firestore se queda en cola (persistencia offline) y su promesa
 * no resuelve hasta tener señal — esperarla dejaría el botón "Salir" colgado,
 * el mismo problema que ya tuvo useEvaluacionActual. Por eso se corta a los
 * TOPE_LIMPIEZA_MS y, si falla o no alcanza, solo queda registrado (el token
 * viejo queda en Firestore hasta que ese usuario vuelva a entrar o lo
 * sobrescriba otro).
 */
export async function limpiarTokenAlCerrarSesion(): Promise<void> {
  if (!pushSoportado()) return
  let temporizador: ReturnType<typeof setTimeout> | undefined
  const tope = new Promise<void>((resolve) => {
    temporizador = setTimeout(resolve, TOPE_LIMPIEZA_MS)
  })
  try {
    await Promise.race([desactivarPush(), tope])
  } catch (err) {
    console.warn('No se pudo limpiar el token FCM al cerrar sesión:', err)
  } finally {
    clearTimeout(temporizador)
  }
}

/** Preferencia del usuario (interruptor de Ajustes). Por defecto: activadas. */
export async function leerPreferencia(): Promise<boolean> {
  const { value } = await Preferences.get({ key: CLAVE_PREFERENCIA })
  return value !== 'false'
}

export async function guardarPreferencia(activadas: boolean): Promise<void> {
  await Preferences.set({ key: CLAVE_PREFERENCIA, value: String(activadas) })
}
