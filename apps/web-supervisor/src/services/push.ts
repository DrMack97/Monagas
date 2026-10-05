// src/services/push.ts
//
// Notificaciones push WEB (FCM) para quienes aprueban evaluaciones
// (SUP_AREA y GERENTE — a ellos les escribe notifyMgr.ts cuando una evaluación
// entra a PENDIENTE_SUPERVISOR). Hasta ahora este panel no tenía ningún código
// de push: ningún supervisor llegaba a tener fcmToken, así que notifyMgr los
// "omitía" siempre (checklist Fase 6, #47).
//
// Piezas: este servicio (permiso + token + mensajes con la pestaña abierta) y
// el service worker /firebase-messaging-sw.js (pestaña cerrada o en segundo
// plano; lo genera el plugin de vite.config.ts desde sw/).
//
// La clave VAPID no hace falta: si getToken() no recibe una, el SDK usa la
// que trae por defecto (DEFAULT_VAPID_KEY en @firebase/messaging) y FCM la
// acepta. Una propia solo serviría para firmar envíos desde un servidor
// externo a FCM, que no es el caso.
//
// El token FCM web es por NAVEGADOR (no por usuario). Por eso se borra al
// cerrar sesión: si no, quien inicie sesión después en ese mismo navegador
// obtendría el mismo token, y el usuario anterior seguiría recibiendo —en ese
// navegador— los avisos del nuevo.

import {
  getMessaging,
  getToken,
  deleteToken,
  onMessage,
  isSupported,
  type MessagePayload,
} from 'firebase/messaging'
import { doc, updateDoc, deleteField } from 'firebase/firestore'
import { app, auth, db } from './firebase'

export type ResultadoActivacion = 'activadas' | 'denegadas' | 'no-soportado' | 'error'
export type EstadoAvisos = 'no-soportado' | 'denegado' | 'inactivo' | 'activo'

type Oyente = (m: MessagePayload) => void
const oyentes = new Set<Oyente>()
let escuchando = false

/** Comprobación síncrona (para decidir si mostrar el botón). La definitiva es isSupported(). */
export function pushSoportado(): boolean {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  )
}

const claveAvisos = (uid: string) => `avisos:${uid}`

function avisosApagados(uid: string): boolean {
  try {
    return localStorage.getItem(claveAvisos(uid)) === 'false'
  } catch {
    return false
  }
}

function guardarPreferencia(uid: string, activos: boolean) {
  try {
    localStorage.setItem(claveAvisos(uid), String(activos))
  } catch {
    // Sin localStorage (modo privado estricto): la preferencia solo vale esta sesión.
  }
}

/** Estado para el botón del Header. Por defecto, con permiso concedido: activo. */
export function estadoAvisos(): EstadoAvisos {
  if (!pushSoportado()) return 'no-soportado'
  if (Notification.permission === 'denied') return 'denegado'
  const uid = auth.currentUser?.uid
  if (uid && Notification.permission === 'granted' && !avisosApagados(uid)) return 'activo'
  return 'inactivo'
}

async function guardarToken(token: string | null): Promise<void> {
  const user = auth.currentUser
  if (!user) return
  // Payload EXACTO: firestore.rules solo deja a un usuario tocar su propio
  // campo fcmToken en /usuarios/{uid} — ninguna otra clave, o se rechaza todo.
  await updateDoc(doc(db, 'usuarios', user.uid), { fcmToken: token ?? deleteField() })
}

/** Avisos recibidos con la pestaña visible (el SDK no muestra nada en ese caso). */
export function suscribirRecibidas(cb: Oyente): () => void {
  oyentes.add(cb)
  return () => {
    oyentes.delete(cb)
  }
}

/** Obtiene el token (registra el service worker la primera vez) y lo guarda en el perfil. */
async function registrarDispositivo(): Promise<void> {
  const messaging = getMessaging(app)
  const token = await getToken(messaging)
  if (!token) throw new Error('FCM no devolvió ningún token')
  await guardarToken(token)
  if (!escuchando) {
    escuchando = true
    onMessage(messaging, (m) => oyentes.forEach((cb) => cb(m)))
  }
}

/** Pide permiso (si hace falta) y registra el navegador. Para el botón "Activar avisos". */
export async function activarPush(): Promise<ResultadoActivacion> {
  if (!pushSoportado() || !(await isSupported())) return 'no-soportado'
  const user = auth.currentUser
  if (!user) return 'error'

  let permiso: NotificationPermission = Notification.permission
  if (permiso === 'default') permiso = await Notification.requestPermission()
  if (permiso !== 'granted') return 'denegadas'

  try {
    await registrarDispositivo()
    guardarPreferencia(user.uid, true)
    return 'activadas'
  } catch (err) {
    console.error('No se pudo activar el push web:', err)
    return 'error'
  }
}

/**
 * Al iniciar sesión: si el permiso ya está concedido y el usuario no apagó los
 * avisos, renueva el registro (el token puede haber rotado). NUNCA pide permiso:
 * un diálogo de permiso sin acción del usuario es mala práctica y Safari lo
 * ignora.
 */
export async function sincronizarPush(): Promise<void> {
  const user = auth.currentUser
  if (!user || !pushSoportado() || !(await isSupported())) return
  if (Notification.permission !== 'granted' || avisosApagados(user.uid)) return
  try {
    await registrarDispositivo()
  } catch (err) {
    console.error('No se pudo renovar el registro push:', err)
  }
}

/** Quita el token del perfil y da de baja el navegador en FCM. */
async function quitarToken(): Promise<void> {
  await guardarToken(null)
  await deleteToken(getMessaging(app)).catch((err) =>
    console.warn('No se pudo dar de baja el token en FCM:', err)
  )
}

/** Interruptor "apagado": recuerda la elección del usuario y quita el token. */
export async function desactivarPush(): Promise<void> {
  const user = auth.currentUser
  if (!user || !pushSoportado() || !(await isSupported())) return
  guardarPreferencia(user.uid, false)
  await quitarToken()
}

export const TOPE_LIMPIEZA_MS = 3000

/**
 * Para llamar justo ANTES de cerrar sesión (auth.currentUser aún existe). No
 * toca la preferencia del usuario. Nunca debe impedir ni retrasar el cierre de
 * sesión: sin conexión el updateDoc queda en cola y su promesa no resuelve
 * hasta tener señal — por eso se corta a los TOPE_LIMPIEZA_MS (mismo criterio
 * que apps/mobile-operator/src/services/push.ts). Si no alcanza, el token viejo
 * queda en el perfil hasta que ese usuario vuelva a entrar.
 */
export async function limpiarTokenAlCerrarSesion(): Promise<void> {
  const user = auth.currentUser
  if (!user || !pushSoportado() || Notification.permission !== 'granted') return
  let temporizador: ReturnType<typeof setTimeout> | undefined
  const tope = new Promise<void>((resolve) => {
    temporizador = setTimeout(resolve, TOPE_LIMPIEZA_MS)
  })
  try {
    await Promise.race([quitarToken(), tope])
  } catch (err) {
    console.warn('No se pudo limpiar el token FCM al cerrar sesión:', err)
  } finally {
    clearTimeout(temporizador)
  }
}
