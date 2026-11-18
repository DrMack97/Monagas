// src/components/UltimaLecturaPanel.tsx
//
// Control de errores de captura: el Operador puede ANULAR o CORREGIR su última lectura mientras la evaluación sigue
// EN_CURSO. Nada se borra: la lectura anulada queda como constancia (con sus valores originales, quién la anuló, cuándo y
// por qué) pero deja de contar en el promedio, la tabla, el reporte y el Excel.
//   · Anular   → la lectura queda anulada; el formulario no cambia.
//   · Corregir → se anula y su contenido se carga en el formulario para capturar los valores correctos y guardar una
//                lectura nueva (que apunta a la anulada con `corrigeA`).
// Solo la ÚLTIMA lectura: la medida final de cada lectura es la inicial de la siguiente, así que tocar una intermedia
// descuadraría las que vienen después. Para deshacer más de una se anula de la última hacia atrás.

import { useState } from 'react'
import { FiRotateCcw } from 'react-icons/fi'
import type { ILectura } from '@core/types'

const MIN_MOTIVO = 3

interface Props {
  lectura: ILectura
  /** nombre de cada tanque por id, para mostrar la medida final */
  nombresTanque: Record<string, string>
  ocupado: boolean
  onAnular: (motivo: string) => Promise<void>
  onCorregir: (motivo: string) => Promise<void>
}

function horaTexto(ts: unknown): string {
  const d = ts instanceof Date ? ts : new Date(ts as string)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })
}

export default function UltimaLecturaPanel({ lectura, nombresTanque, ocupado, onAnular, onCorregir }: Props) {
  const [modo, setModo] = useState<'anular' | 'corregir' | null>(null)
  const [motivo, setMotivo] = useState('')
  const motivoValido = motivo.trim().length >= MIN_MOTIVO

  async function confirmar() {
    if (!modo || !motivoValido) return
    const accion = modo === 'anular' ? onAnular : onCorregir
    await accion(motivo.trim())
    setModo(null)
    setMotivo('')
  }

  const medidas = lectura.tanques.map((t) => `${nombresTanque[t.tanqueId] ?? t.tanqueId}: ${t.mf}`).join(' · ')

  return (
    <section aria-label="Última lectura" className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-1">
          <FiRotateCcw aria-hidden="true" /> Última lectura · #{lectura.hora}
        </h3>
        <span className="text-xs text-slate-500">{horaTexto(lectura.timestamp)}</span>
      </div>
      <p className="text-xs text-slate-400 font-mono">Medida final → {medidas}</p>
      <p className="text-xs text-slate-400 font-mono">
        {lectura.gas ? `Pf ${lectura.gas.pf} · Hw ${lectura.gas.hw} · ` : ''}P.Cab {lectura.operativos?.pCab ?? 0} · P.Sep {lectura.operativos?.pSep ?? 0}
      </p>

      {modo === null ? (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setModo('corregir')}
            disabled={ocupado}
            className="bg-slate-800 border border-slate-700 text-white font-medium rounded-lg py-2 text-sm disabled:opacity-50"
          >
            Corregir
          </button>
          <button
            onClick={() => setModo('anular')}
            disabled={ocupado}
            className="bg-slate-800 border border-slate-700 text-white font-medium rounded-lg py-2 text-sm disabled:opacity-50"
          >
            Anular
          </button>
        </div>
      ) : (
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <p className="text-xs text-slate-400">
            {modo === 'anular'
              ? 'La lectura NO se borra: queda como constancia, pero deja de contar en el promedio, la tabla, el reporte y el Excel.'
              : 'La lectura se anula (queda como constancia) y su contenido se carga abajo para que captures los valores correctos y guardes una lectura nueva.'}
          </p>
          <label htmlFor="motivo-anulacion" className="block text-xs text-slate-500">¿Qué estaba mal? (obligatorio)</label>
          <input
            id="motivo-anulacion"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            maxLength={200}
            placeholder="Ej.: medí mal el tanque 2"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-sm"
          />
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => { setModo(null); setMotivo('') }}
              disabled={ocupado}
              className="bg-slate-800 border border-slate-700 text-white rounded-lg py-2 text-sm disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={confirmar}
              disabled={ocupado || !motivoValido}
              className="bg-red-600 text-white font-medium rounded-lg py-2 text-sm disabled:opacity-50"
            >
              {ocupado ? 'Procesando...' : modo === 'anular' ? 'Anular lectura' : 'Anular y corregir'}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
