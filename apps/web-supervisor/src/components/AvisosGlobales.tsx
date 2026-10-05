// src/components/AvisosGlobales.tsx
//
// Se monta una vez en App.tsx (dentro del Router) y hace dos cosas para
// SUP_AREA/GERENTE, que son quienes reciben los push de notifyMgr.ts:
//  - al iniciar sesión, renueva el registro push si el permiso ya estaba
//    concedido (sin pedirlo — eso lo hace el botón del Header);
//  - con la pestaña visible el SDK NO muestra notificación del sistema (la
//    reenvía a la página), así que aquí se muestra un aviso emergente.

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { MessagePayload } from 'firebase/messaging'
import { useAuth } from '../hooks/useAuth'
import { sincronizarPush, suscribirRecibidas } from '../services/push'

const DURACION_AVISO_MS = 10000

export default function AvisosGlobales() {
  const { user, rol } = useAuth()
  const navigate = useNavigate()
  const [aviso, setAviso] = useState<MessagePayload | null>(null)
  const recibeAvisos = !!user && (rol === 'SUP_AREA' || rol === 'GERENTE')
  const uid = user?.uid

  useEffect(() => {
    if (!recibeAvisos) return
    sincronizarPush()
    return suscribirRecibidas(setAviso)
  }, [recibeAvisos, uid])

  useEffect(() => {
    if (!aviso) return
    const t = setTimeout(() => setAviso(null), DURACION_AVISO_MS)
    return () => clearTimeout(t)
  }, [aviso])

  if (!aviso) return null

  const titulo = aviso.notification?.title ?? 'Nueva notificación'
  const cuerpo = aviso.notification?.body

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-700 bg-slate-900 p-4 shadow-xl"
    >
      <p className="text-sm font-semibold text-white">{titulo}</p>
      {cuerpo && <p className="mt-1 text-sm text-slate-300">{cuerpo}</p>}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => {
            setAviso(null)
            navigate('/aprobaciones')
          }}
          className="text-xs rounded-lg bg-emerald-700 px-3 py-1.5 text-white hover:bg-emerald-600"
        >
          Ver aprobaciones
        </button>
        <button
          type="button"
          onClick={() => setAviso(null)}
          className="text-xs rounded-lg border border-slate-700 px-3 py-1.5 text-slate-300 hover:bg-slate-800"
        >
          Cerrar
        </button>
      </div>
    </div>
  )
}
