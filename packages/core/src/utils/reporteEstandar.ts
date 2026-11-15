// packages/core/src/utils/reporteEstandar.ts
//
// Reporte operacional estándar de Well Testing (Informe Técnico Willytank, 04/11/2026, sección 2).
// Una sola fuente de verdad: la estructura se construye aquí y de ella salen el texto de WhatsApp y
// la hoja "Resumen" del Excel, para que los dos canales nunca difieran.
//
// Reglas de contenido:
//  - Hora del encabezado: hora entera más cercana (no el minuto real).
//  - Las alertas operativas NO forman parte del reporte (son de control interno).
//  - Sin dato → "—" (nunca un valor inventado). Se calculan solo cosas que se derivan de lo capturado:
//      · existencia por tanque = medida final (mf) × factor tanque (kk); total = suma si no se digitó;
//      · Total Despachado General = Total Trasegado Acumulado + Existencia Total (así cuadra el ejemplo
//        del informe: 2,542.92 + 117 = 2,659.92);
//      · Total Trasegado (24 Hrs) = suma de los volúmenes de los viajes de vacuum de las últimas 24 h.

import type { IPozo, ILectura, IResultadosEval, IReporteOperativo } from '../types/database.js'
import { redondearAHoraEntera } from './hora.js'

export interface DatosReporteEstandar {
  pozo: Pick<IPozo, 'nombre' | 'empresa' | 'equipo' | 'reductorPulgadas' | 'meterRun' | 'diamOrif' | 'tanques'>
  reporte: IReporteOperativo
  resultados: Pick<IResultadosEval, 'proyeccion24H' | 'bpdPromedio' | 'aysBls' | 'qgPromedio'>
  lecturas: ILectura[]
  /** Momento de emisión; se pasa de afuera para que el reporte sea determinista y testeable. */
  ahora: Date
  /** Fecha de la primera lectura, usada si no hay fecha de alineación. */
  fechaInicioFallback?: Date
}

/**
 * Un renglón del reporte: pares etiqueta/valor que van en la misma línea ("P.Cab: 540 PSI | Red: 1"")
 * y, opcionalmente, líneas de detalle justo debajo (los viajes de vacuum).
 */
export interface FilaReporte {
  pares: [etiqueta: string, valor: string][]
  detalle?: string[]
}

export interface SeccionReporte {
  /** Título en mayúsculas (sin asteriscos ni dos puntos). Vacío = campos sueltos del encabezado. */
  titulo: string
  /** Cada fila es un viñeta de la sección; en las secciones sin título es un campo suelto. */
  filas: FilaReporte[]
}

export interface ReporteEstandar {
  gerencia: string
  titulo: string
  secciones: SeccionReporte[]
}

const NA = '—'

// --- formato numérico -----------------------------------------------------------
function trim(n: number, dec = 2): string {
  return Number(n.toFixed(dec)).toLocaleString('en-US', { maximumFractionDigits: dec })
}
function fijo(n: number, dec: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec })
}
function dosDigitos(n: number): string {
  return String(n).padStart(2, '0')
}
function fecha(d: Date): string {
  return `${dosDigitos(d.getDate())}/${dosDigitos(d.getMonth() + 1)}/${d.getFullYear()}`
}
function hora(d: Date): string {
  return `${dosDigitos(d.getHours())}:${dosDigitos(d.getMinutes())}`
}
function texto(s: string | undefined): string {
  return s && s.trim() ? s.trim() : NA
}
const ORDINALES = ['1er', '2do', '3er', '4to', '5to', '6to', '7mo', '8vo', '9no', '10mo']
function ordinal(n: number): string {
  return ORDINALES[n - 1] ?? `${n}º`
}
function aDate(d: Date | { toDate(): Date } | undefined): Date | undefined {
  if (!d) return undefined
  return d instanceof Date ? d : typeof d.toDate === 'function' ? d.toDate() : new Date(d as unknown as string)
}

export function construirReporteEstandar(datos: DatosReporteEstandar): ReporteEstandar {
  const { pozo, reporte, resultados, lecturas, ahora } = datos
  const ultima = lecturas[lecturas.length - 1]
  const horaReporte = redondearAHoraEntera(ahora)

  // --- encabezado ---
  const alineacion = aDate(reporte.fechaAlineacion) ?? datos.fechaInicioFallback
  const culminacion = aDate(reporte.fechaCulminacion)

  // --- parámetros de operación ---
  const bph = resultados.proyeccion24H / 24
  const bpd = resultados.bpdPromedio
  const bsw = bpd > 0 ? (resultados.aysBls / bpd) * 100 : 0

  // --- tanques: existencia = mf × kk del último registro ---
  const tanquesPozo = pozo.tanques ?? []
  const volumenTanques = tanquesPozo.map((t) => {
    const lt = ultima?.tanques.find((x) => x.tanqueId === t.id)
    return lt ? lt.mf * t.ft : undefined
  })
  const sumaTanques = volumenTanques.every((v) => v !== undefined)
    ? (volumenTanques as number[]).reduce((a, b) => a + b, 0)
    : undefined
  const resumen = reporte.resumenTanques
  const existencia = resumen?.existencia ?? sumaTanques
  const trasegable = resumen?.trasegable
  const totalTrasegado = resumen?.totalTrasegado
  const despachado = totalTrasegado !== undefined && existencia !== undefined ? totalTrasegado + existencia : undefined

  // --- vacuum ---
  const viajes = [...(reporte.viajesVacuum24h ?? [])]
  const totalViajes24h = viajes.reduce((acc, v) => acc + (v.volumen || 0), 0)

  // --- gas: Qg de la última lectura (si no hay, el promedio de la evaluación) ---
  const qgTexto = ultima?.gas
    ? `${fijo(ultima.gas.qg, 2)} MMSCFD`
    : resultados.qgPromedio > 0
    ? `${fijo(resultados.qgPromedio, 2)} MMSCFD`
    : NA

  // Atajo: una fila de uno o varios pares etiqueta/valor
  const f = (...pares: [string, string][]): FilaReporte => ({ pares })

  const secciones: SeccionReporte[] = [
    {
      titulo: '',
      filas: [
        f(['EMPRESA', texto(pozo.empresa)]),
        f(['Equipo', texto(pozo.equipo)]),
        f(['Pozo', texto(pozo.nombre)]),
        f(['Fecha', fecha(horaReporte)]),
        f(['Hora', `${hora(horaReporte)} Hrs`]),
      ],
    },
    {
      titulo: 'Supv. Producción PDVSA',
      filas: [f(['Diurno', texto(reporte.supervisorPDVSA)]), f(['Nocturno', texto(reporte.supervisorPDVSANocturno)])],
    },
    {
      titulo: 'Supv. Well Testing (DSI)',
      filas: [f(['Diurno', texto(reporte.cuadrillaDiurno)]), f(['Nocturno', texto(reporte.cuadrillaNocturno)])],
    },
    {
      titulo: '',
      filas: [
        f(['Fecha Inicio Well Testing', alineacion ? fecha(alineacion) : NA]),
        f(['Fecha Culminación', culminacion ? fecha(culminacion) : 'En progreso']),
        f(['ESTATUS ACTUAL', texto(reporte.estadoActual)]),
        f(['ASUNTO', texto(reporte.asunto)]),
        f(['PLAN', texto(reporte.plan)]),
      ],
    },
    {
      titulo: 'PARÁMETROS DE OPERACIÓN',
      filas: [
        f(
          ['P.Cab', ultima ? `${trim(ultima.operativos.pCab, 1)} PSI` : NA],
          ['Red', texto(pozo.reductorPulgadas)],
          ['P.Sep', ultima ? `${trim(ultima.operativos.pSep, 1)} PSI` : NA]
        ),
        f(['Caudal Líquido', `${trim(bph)} BPH | ${trim(bpd)} BPD`]),
        f(['Total Despachado General', despachado !== undefined ? `${fijo(despachado, 2)} Bls` : NA]),
      ],
    },
    {
      titulo: 'MEDICIÓN Y CAUDAL DE GAS',
      filas: [
        f(
          ['Meter Run', pozo.meterRun ? `${fijo(pozo.meterRun, 3)}"` : NA],
          ['Placa Orificio', pozo.diamOrif ? `${fijo(pozo.diamOrif, 3)}"` : NA]
        ),
        f(
          ['P. Estática', ultima?.gas ? `${trim(ultima.gas.pf, 1)} PSI` : NA],
          ['P. Diferencial', ultima?.gas ? `${trim(ultima.gas.hw, 2)} inH2O` : NA]
        ),
        f(
          ['GE Gas', ultima?.gas ? fijo(ultima.gas.gg, 2) : NA],
          ['T. Gas', ultima?.gas ? `${fijo(ultima.gas.tGas, 0)} °F` : NA]
        ),
        // Qg de la ÚLTIMA lectura: es el caudal que corresponde a la presión/diferencial que se muestran.
        f(['Caudal de Gas (Qg)', qgTexto]),
        f(
          ['Calidad', reporte.tipoFluido ? `${trim(reporte.tipoFluido.api, 1)} °API` : NA],
          ['BSW', `${trim(bsw, 1)}% H2O`]
        ),
      ],
    },
    {
      titulo: 'ESTATUS DE TANQUES DE ALMACENAMIENTO',
      filas: [
        f(...tanquesPozo.map((t, i): [string, string] => [
          `Tanque #${i + 1}`,
          volumenTanques[i] !== undefined ? `${trim(volumenTanques[i] as number)} Bls` : NA,
        ])),
        f(
          ['Existencia Total', existencia !== undefined ? `${trim(existencia)} Bls` : NA],
          ['Total Trasegable', trasegable !== undefined ? `${trim(trasegable)} Bls` : NA]
        ),
        f(['Total Trasegado Acumulado', totalTrasegado !== undefined ? `${fijo(totalTrasegado, 2)} Bls` : NA]),
      ],
    },
    {
      titulo: 'CONTROL DE VACUUM Y DISPOSICIÓN',
      filas: [
        f(['Nivel de Celler', reporte.nivelCellar !== undefined ? `${trim(reporte.nivelCellar, 0)}%` : NA]),
        f(['Total Viajes Vacuum Acumulados', reporte.viajesVacuum !== undefined ? String(reporte.viajesVacuum) : NA]),
        {
          pares: [['Viajes Vacuum (Últimas 24 Hrs)', dosDigitos(viajes.length)]],
          detalle: viajes.map((v, i) => {
            const fh = aDate(v.fechaHora)
            return `${ordinal(i + 1)} Viaje: [${fh ? `${fecha(fh)} - ${hora(fh)} Hrs` : NA}] | Chófer: ${texto(v.chofer)} | Vol: ${trim(v.volumen)} Bls | Destino: ${texto(v.destino)}`
          }),
        },
        f(['Total Trasegado (24 Hrs)', viajes.length > 0 ? `${trim(totalViajes24h)} BLS` : NA]),
      ],
    },
  ]

  return { gerencia: 'GERENCIA DE PRODUCCIÓN DIV PDM', titulo: 'REPORTE OPERACIONES DE WT', secciones }
}

/** Texto para WhatsApp (negritas con *...*). */
export function reporteAWhatsApp(r: ReporteEstandar): string {
  const lineas: string[] = [`*${r.gerencia}*`, `*${r.titulo}*`, '']
  for (const s of r.secciones) {
    if (s.titulo) {
      lineas.push(`*${s.titulo}:*`)
      for (const fila of s.filas) {
        lineas.push(`• ${fila.pares.map(([e, v]) => `${e}: ${v}`).join(' | ')}`)
        for (const d of fila.detalle ?? []) lineas.push(`   - ${d}`)
      }
    } else {
      for (const fila of s.filas) lineas.push(fila.pares.map(([e, v]) => `*${e}:* ${v}`).join(' '))
    }
    lineas.push('')
  }
  while (lineas[lineas.length - 1] === '') lineas.pop()
  return lineas.join('\n')
}

/** Filas clave/valor para la hoja "Resumen" del Excel (mismo contenido que el texto de WhatsApp). */
export function reporteAFilasExcel(r: ReporteEstandar): (string | number)[][] {
  const filas: (string | number)[][] = [[r.gerencia], [r.titulo], []]
  for (const s of r.secciones) {
    if (s.titulo) filas.push([s.titulo, ''])
    for (const fila of s.filas) {
      for (const [e, v] of fila.pares) filas.push([e, v])
      for (const d of fila.detalle ?? []) filas.push(['', d])
    }
    filas.push([])
  }
  while (filas.length > 0 && filas[filas.length - 1].length === 0) filas.pop()
  return filas
}
