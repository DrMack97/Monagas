// src/hooks/useNotifications.ts
//
// Capa de React sobre services/push.ts (toda la lógica nativa vive allí, ver
// su cabecera: por qué ya no se usa Notification/VAPID/firebase-messaging).
//
// - `habilitadas`: preferencia del usuario (interruptor de Ajustes),
//   persistida con @capacitor/preferences. Por defecto: activadas.
// - `activar()` / `desactivar()`: las llama el interruptor.
// - `sincronizar()`: la llama el Dashboard al abrir — si la preferencia está
//   en "activadas" registra el dispositivo (pide permiso la primera vez). Antes
//   esto solo ocurría si el usuario apagaba y volvía a encender el interruptor
//   de Ajustes (arrancaba "encendido" sin haber pedido permiso jamás), así que
//   en la práctica ningún Operador llegaba a guardar su token.

import { useCallback, useEffect, useState } from 'react'
import type { PushNotificationSchema } from '@capacitor/push-notifications'
import {
  activarPush,
  desactivarPush,
  guardarPreferencia,
  leerPreferencia,
  pushSoportado,
  suscribirRecibidas,
  type ResultadoActivacion,
} from '../services/push'

export function useNotifications() {
  const soportado = pushSoportado()
  const [habilitadas, setHabilitadas] = useState<boolean>(true)
  const [permisoDenegado, setPermisoDenegado] = useState(false)
  const [ultimaNotificacion, setUltimaNotificacion] = useState<PushNotificationSchema | null>(null)

  useEffect(() => {
    if (!soportado) return
    leerPreferencia().then(setHabilitadas).catch(() => {})
    return suscribirRecibidas(setUltimaNotificacion)
  }, [soportado])

  const aplicar = (resultado: ResultadoActivacion) => {
    setPermisoDenegado(resultado === 'denegadas')
    return resultado === 'activadas'
  }

  /** Enciende el interruptor: guarda la preferencia y registra el dispositivo. */
  const activar = useCallback(async (): Promise<boolean> => {
    await guardarPreferencia(true)
    setHabilitadas(true)
    return aplicar(await activarPush())
  }, [])

  /** Apaga el interruptor: guarda la preferencia y quita el token. */
  const desactivar = useCallback(async (): Promise<void> => {
    await guardarPreferencia(false)
    setHabilitadas(false)
    setPermisoDenegado(false)
    await desactivarPush()
  }, [])

  /** Al abrir la app: si la preferencia es "activadas", registra el dispositivo. */
  const sincronizar = useCallback(async (): Promise<void> => {
    if (!soportado) return
    if (!(await leerPreferencia())) return
    aplicar(await activarPush())
  }, [soportado])

  return { soportado, habilitadas, permisoDenegado, ultimaNotificacion, activar, desactivar, sincronizar }
}
