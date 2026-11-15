// packages/core/src/utils/exportesExcel.ts
//
// Estructura de los DOS formatos de exportación a Excel (pedido del cliente, 2026-11-15). Son independientes: cada uno
// se genera y se descarga por separado, con su propio nombre y sus propias hojas.
//
//   1) DATA HISTÓRICA DEL EQUIPO — toda la data acumulada del equipo de testing situado en el pozo/locación desde el
//      inicio de sus operaciones. Refleja el DESPLAZADO TOTAL del equipo: el "desplazado inicial" que el Supervisor
//      carga una vez en el pozo (lo acumulado antes de la app) más la producción registrada por la app A PARTIR de la
//      fecha de ese corte, a lo largo de todas las evaluaciones.
//
//   2) DATOS DE EVALUACIÓN DIARIA — la evaluación (prueba) de un día, desde la hora de inicio de ESA prueba. Su
//      desplazado es único y exclusivo del lapso de la prueba: arranca en 0 en la primera lectura y no arrastra nada
//      de otras pruebas ni el desplazado inicial.
//
// "Desplazado" de una lectura = producción registrada en ese intervalo, Σ por tanque de (barriles/hora × horas) tal como
// quedó guardada (es la que alimenta Bpd, Netos y el promedio que se aprueba). Columnas en el orden de la planilla de
// campo (lo leído de la foto del anexo del Informe Técnico): hora, presiones, red, gas, tanques, BPH, BPD, total
// desplazado, existencia neta, trasegado, viajes, total trasegado y BSW.
//
// Reglas del informe que se respetan: hora entera más cercana con la fecha una vez por día; sin alertas operativas
// (control interno); Netos y Casing solo en las zonas que los usan (no en Norte de Monagas).
//
// Funciones PURAS: devuelven filas listas para XLSX.utils.aoa_to_sheet; no conocen xlsx ni Firestore.

import type { ILectura, IPozo } from '../types/database.js'
import { redondearAHoraEntera } from './hora.js'
import { capacidadesZona } from '../constants/zonas.js'

export type Celda = string | number
export interface HojaExcel {
  nombre: string
  filas: Celda[][]
  /** Ancho de cada columna (caracteres). */
  anchos?: number[]
}

type FechaFirestore = Date | { toDate(): Date } | string | number | null | undefined

export interface PozoParaExcel
  extends Pick<IPozo, 'nombre' | 'campo' | 'zona' | 'empresa' | 'equipo' | 'reductorPulgadas' | 'diamOrif' | 'meterRun' | 'tanques'> {
  /** Lo acumulado (Bls) antes de que la app registrara el pozo; lo carga el Supervisor una vez. */
  desplazadoInicial?: number
  /** Desde cuándo cuenta la app: solo las lecturas a partir de esta fecha se suman al desplazado inicial. */
  desplazadoInicialDesde?: FechaFirestore
}

export interface EvaluacionParaExcel {
  id: string
  creadoEn: FechaFirestore
  estado?: string
  /** Lecturas de la evaluación; se ordenan por hora. */
  lecturas: ILectura[]
}

// --- utilidades ---------------------------------------------------------------------------------------------------

function aDate(v: FechaFirestore): Date | undefined {
  if (v === null || v === undefined || v === '') return undefined
  const d = typeof v === 'object' && 'toDate' in v && typeof v.toDate === 'function' ? v.toDate() : v instanceof Date ? v : new Date(v as string | number)
  return Number.isFinite(d.getTime()) ? d : undefined
}
const dos = (n: number) => String(n).padStart(2, '0')
const fechaTexto = (d: Date) => `${dos(d.getDate())}/${dos(d.getMonth() + 1)}/${d.getFullYear()}`
const horaTexto = (d: Date) => `${dos(d.getHours())}:00`
const r2 = (n: number) => Number(n.toFixed(2))
const num = (n: unknown) => (typeof n === 'number' && Number.isFinite(n) ? n : 0)

function momento(l: ILectura): Date {
  return aDate(l.timestamp as FechaFirestore) ?? new Date(0)
}

/** Producción registrada en una lectura (Bls): Σ por tanque de barriles/hora × horas del intervalo. */
export function desplazadoDeLectura(l: ILectura): number {
  return l.tanques.reduce((acc, t) => acc + num(t.bph) * num(t.th), 0)
}
/** Barriles que los viajes de vacuum retiraron en esa lectura. */
export function trasegadoDeLectura(l: ILectura): number {
  return l.tanques.reduce((acc, t) => acc + (typeof t.trasegado === 'number' && t.trasegado > 0 ? t.trasegado : 0), 0)
}
/** Viajes registrados en esa lectura (un registro de trasegado por tanque). */
export function viajesDeLectura(l: ILectura): number {
  return l.tanques.filter((t) => typeof t.trasegado === 'number' && t.trasegado > 0).length
}

function ordenadas(lecturas: ILectura[]): ILectura[] {
  return [...lecturas].sort((a, b) => num(a.hora) - num(b.hora) || momento(a).getTime() - momento(b).getTime())
}

// --- tabla de lecturas (común a los dos formatos) ----------------------------------------------------------------

interface OpcionesTabla {
  pozo: PozoParaExcel
  /** Cada bloque son las lecturas de una evaluación, en orden cronológico. */
  evaluaciones: ILectura[][]
  /** Desplazado con el que arranca el acumulado (0 en la evaluación diaria; el desplazado inicial en el histórico). */
  desplazadoBase: number
  /** El histórico agrega la columna con el número de evaluación. */
  conColumnaEvaluacion: boolean
}

interface ResultadoTabla {
  filas: Celda[][]
  /** Totales de cada evaluación (para el resumen y para los pies). */
  porEvaluacion: { desplazado: number; trasegado: number; viajes: number; existenciaFinal: number | undefined; acumuladoAlCierre: number }[]
  desplazadoTotal: number
  trasegadoTotal: number
  viajesTotal: number
}

function tablaDeLecturas({ pozo, evaluaciones, desplazadoBase, conColumnaEvaluacion }: OpcionesTabla): ResultadoTabla {
  const caps = capacidadesZona(pozo.zona)
  const tanques = pozo.tanques ?? []

  const titulos: string[] = [
    'Fecha',
    'Hora',
    ...(conColumnaEvaluacion ? ['Evaluación'] : []),
    'P. Cab (psi)',
    ...(caps.casing ? ['P. Casing (psi)'] : []),
    'Red (pulg)',
    'P. Estática (psi)',
    'T. Gas (°F)',
    'P. Dif (inH2O)',
    'Orif (pulg)',
    'Q. Gas (MMSCFD)',
    ...tanques.flatMap<string>((t, i) => [`T${i + 1} Medida (pulg)`, `T${i + 1} Volumen (Bls)`]),
    'BPH (Bls)',
    'BPD (Bls)',
    ...(caps.netosEnLecturas ? ['Netos (Bls)'] : []),
    'Desplazado de la hora (Bls)',
    'TOTAL DESPLAZADO (Bls)',
    'Exist. Neta (Bls)',
    'Trasegado de la hora (Bls)',
    'Total Trasegado (Bls)',
    'Viajes Vacuum (acum.)',
    'BSW (%)',
  ]

  const filas: Celda[][] = [titulos]
  let desplazado = desplazadoBase
  let trasegado = 0
  let viajes = 0
  let diaAnterior = ''
  const porEvaluacion: ResultadoTabla['porEvaluacion'] = []

  evaluaciones.forEach((lecturas, idx) => {
    let desplEval = 0
    let trasEval = 0
    let viajesEval = 0
    let existenciaFinal: number | undefined

    for (const l of ordenadas(lecturas)) {
      const hora = redondearAHoraEntera(momento(l))
      const dia = fechaTexto(hora)
      const fecha = dia !== diaAnterior ? dia : ''
      diaAnterior = dia

      const dHora = desplazadoDeLectura(l)
      const tHora = trasegadoDeLectura(l)
      desplazado += dHora
      trasegado += tHora
      viajes += viajesDeLectura(l)
      desplEval += dHora
      trasEval += tHora
      viajesEval += viajesDeLectura(l)

      const porTanque = tanques.map((t) => {
        const e = l.tanques.find((x) => x.tanqueId === t.id)
        return e ? { medida: num(e.mf), volumen: num(e.mf) * num(t.ft) } : undefined
      })
      const existencia = porTanque.length > 0 && porTanque.every((x) => x !== undefined)
        ? (porTanque as { volumen: number }[]).reduce((a, x) => a + x.volumen, 0)
        : undefined
      existenciaFinal = existencia

      const bpd = l.tanques.reduce((a, t) => a + num(t.bpd), 0)
      const bph = l.tanques.reduce((a, t) => a + num(t.bph), 0)
      const netos = l.tanques.reduce((a, t) => a + num(t.netos), 0)
      const ays = l.tanques.reduce((a, t) => a + num(t.aysBls), 0)

      filas.push([
        fecha,
        horaTexto(hora),
        ...(conColumnaEvaluacion ? [idx + 1] : []),
        l.operativos?.pCab ?? '',
        ...(caps.casing ? [l.operativos?.pCsg ?? ''] : []),
        l.operativos?.reductorPulgadas ?? pozo.reductorPulgadas ?? '',
        l.gas ? r2(l.gas.pf) : '',
        l.gas ? r2(l.gas.tGas) : '',
        l.gas ? r2(l.gas.hw) : '',
        l.gas ? l.gas.diam : '',
        l.gas ? r2(l.gas.qg) : '',
        ...porTanque.flatMap<Celda>((x) => (x ? [r2(x.medida), r2(x.volumen)] : ['', ''])),
        r2(bph),
        r2(bpd),
        ...(caps.netosEnLecturas ? [r2(netos)] : []),
        r2(dHora),
        r2(desplazado),
        existencia !== undefined ? r2(existencia) : '',
        r2(tHora),
        r2(trasegado),
        viajes,
        bpd > 0 ? r2((ays / bpd) * 100) : 0,
      ])
    }
    porEvaluacion.push({ desplazado: desplEval, trasegado: trasEval, viajes: viajesEval, existenciaFinal, acumuladoAlCierre: desplazado })
  })

  return { filas, porEvaluacion, desplazadoTotal: desplazado, trasegadoTotal: trasegado, viajesTotal: viajes }
}

function bloqueEncabezado(pozo: PozoParaExcel, titulo: string, subtitulo: string, extra: Celda[][]): Celda[][] {
  return [
    ['GERENCIA DE OPERACIONES - WELL TESTING'],
    [titulo],
    [subtitulo],
    [],
    ['Empresa', pozo.empresa ?? '—', '', 'Equipo', pozo.equipo ?? '—'],
    ['Pozo', pozo.nombre, '', 'Campo', pozo.campo],
    ['Placa Orificio (pulg)', pozo.diamOrif ?? '—', '', 'Meter Run (pulg)', pozo.meterRun ?? '—'],
    ...extra,
    [],
  ]
}

// --- 2) DATOS DE EVALUACIÓN DIARIA ---------------------------------------------------------------------------------

/**
 * Hojas del formato "Datos de Evaluación Diaria": la prueba en curso desde su hora de inicio, con un desplazado único y
 * exclusivo de ese lapso. `hojaReporte` es opcional: filas del reporte estándar del día para incluirlas como segunda hoja.
 */
export function construirEvaluacionDiaria(pozo: PozoParaExcel, evaluacion: EvaluacionParaExcel, hojaReporte?: Celda[][]): HojaExcel[] {
  const lecturas = ordenadas(evaluacion.lecturas)
  const inicio = lecturas.length > 0 ? redondearAHoraEntera(momento(lecturas[0])) : undefined
  const fin = lecturas.length > 0 ? redondearAHoraEntera(momento(lecturas[lecturas.length - 1])) : undefined
  const t = tablaDeLecturas({ pozo, evaluaciones: [lecturas], desplazadoBase: 0, conColumnaEvaluacion: false })

  const filas: Celda[][] = [
    ...bloqueEncabezado(pozo, 'DATOS DE EVALUACIÓN DIARIA', 'Prueba de producción — desplazado exclusivo del lapso de la prueba', [
      ['Inicio de la prueba', inicio ? `${fechaTexto(inicio)} ${horaTexto(inicio)}` : '—', '', 'Última lectura', fin ? `${fechaTexto(fin)} ${horaTexto(fin)}` : '—'],
      ['Horas evaluadas', lecturas.length, '', 'Estado', evaluacion.estado ?? '—'],
    ]),
    ...t.filas,
    [],
    ['DESPLAZADO TOTAL DE LA PRUEBA (Bls)', r2(t.desplazadoTotal)],
    ['Total trasegado en la prueba (Bls)', r2(t.trasegadoTotal)],
    ['Viajes de vacuum en la prueba', t.viajesTotal],
  ]

  const hojas: HojaExcel[] = [{ nombre: 'Evaluación diaria', filas }]
  if (hojaReporte && hojaReporte.length > 0) hojas.push({ nombre: 'Reporte', filas: hojaReporte, anchos: [34, 60] })
  return hojas
}

// --- 1) DATA HISTÓRICA DEL EQUIPO ----------------------------------------------------------------------------------

/**
 * Hojas del formato "Data Histórica del Equipo": todas las evaluaciones del pozo en orden cronológico, con el
 * desplazado acumulado del equipo (desplazado inicial + producción registrada desde la fecha de corte).
 */
export function construirHistoricoEquipo(pozo: PozoParaExcel, evaluaciones: EvaluacionParaExcel[]): HojaExcel[] {
  const corte = aDate(pozo.desplazadoInicialDesde)
  const base = num(pozo.desplazadoInicial)

  // Evaluaciones en orden cronológico; solo cuentan las lecturas desde la fecha de corte (lo anterior ya está en la base).
  const ciclos = [...evaluaciones]
    .sort((a, b) => (aDate(a.creadoEn)?.getTime() ?? 0) - (aDate(b.creadoEn)?.getTime() ?? 0))
    .map((e) => ({ ...e, lecturas: ordenadas(e.lecturas).filter((l) => !corte || momento(l).getTime() >= corte.getTime()) }))
    .filter((e) => e.lecturas.length > 0)

  const t = tablaDeLecturas({ pozo, evaluaciones: ciclos.map((c) => c.lecturas), desplazadoBase: base, conColumnaEvaluacion: true })
  const primera = ciclos[0]?.lecturas[0]
  const ultima = ciclos.length > 0 ? ciclos[ciclos.length - 1].lecturas.slice(-1)[0] : undefined

  const filasDatos: Celda[][] = [
    ...bloqueEncabezado(pozo, 'DATA HISTÓRICA DEL EQUIPO', 'Data acumulada del equipo de testing en la locación desde el inicio de sus operaciones', [
      ['Desplazado inicial (Bls)', base, '', 'Acumulado desde', corte ? fechaTexto(corte) : 'primera lectura'],
      ['Primera lectura', primera ? fechaTexto(redondearAHoraEntera(momento(primera))) : '—', '', 'Última lectura', ultima ? fechaTexto(redondearAHoraEntera(momento(ultima))) : '—'],
      ['Evaluaciones', ciclos.length],
    ]),
    ...t.filas,
    [],
    ['DESPLAZADO TOTAL DEL EQUIPO (Bls)', r2(t.desplazadoTotal)],
    ['  de ello, desplazado inicial (Bls)', r2(base)],
    ['  de ello, registrado por la app (Bls)', r2(t.desplazadoTotal - base)],
    ['Total trasegado registrado (Bls)', r2(t.trasegadoTotal)],
    ['Viajes de vacuum registrados', t.viajesTotal],
  ]

  const filasResumen: Celda[][] = [
    ['Evaluación', 'Inicio', 'Última lectura', 'Horas', 'Desplazado de la evaluación (Bls)', 'Trasegado (Bls)', 'Viajes', 'Existencia final (Bls)', 'Desplazado acumulado al cierre (Bls)', 'Estado'],
    ...ciclos.map((c, i) => {
      const r = t.porEvaluacion[i]
      const ini = redondearAHoraEntera(momento(c.lecturas[0]))
      const fi = redondearAHoraEntera(momento(c.lecturas[c.lecturas.length - 1]))
      return [
        i + 1,
        `${fechaTexto(ini)} ${horaTexto(ini)}`,
        `${fechaTexto(fi)} ${horaTexto(fi)}`,
        c.lecturas.length,
        r2(r.desplazado),
        r2(r.trasegado),
        r.viajes,
        r.existenciaFinal !== undefined ? r2(r.existenciaFinal) : '',
        r2(r.acumuladoAlCierre),
        c.estado ?? '',
      ] as Celda[]
    }),
  ]

  return [
    { nombre: 'Data histórica', filas: filasDatos },
    { nombre: 'Resumen por evaluación', filas: filasResumen, anchos: [11, 18, 18, 8, 22, 14, 8, 18, 24, 22] },
  ]
}
