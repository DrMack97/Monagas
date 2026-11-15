import { describe, it, expect } from 'vitest'
import { construirEvaluacionDiaria, construirHistoricoEquipo, desplazadoDeLectura, trasegadoDeLectura, viajesDeLectura } from '../src/utils/exportesExcel.js'
import type { PozoParaExcel } from '../src/utils/exportesExcel.js'

const pozo = (zona = 'MONAGAS', extra: Partial<PozoParaExcel> = {}): PozoParaExcel =>
  ({
    nombre: 'SBC-61 L', campo: 'Bare', zona: zona as any, empresa: 'DSI', equipo: 'Well Testing 1440', reductorPulgadas: '1"', diamOrif: 3.25, meterRun: 3.826,
    tanques: [{ id: 't1', nombre: 'Tanque 1', mi: 0, ft: 5.2 }, { id: 't2', nombre: 'Tanque 2', mi: 0, ft: 5.2 }],
    ...extra,
  }) as PozoParaExcel

/** Lectura con el tanque 2 produciendo `bph2` Bls/h (tanque 1 sin uso). */
function lectura(hora: number, ts: Date, bph2: number, mf2: number, trasegado2?: number, th = 1) {
  return {
    id: `l${hora}-${ts.getTime()}`, hora, timestamp: ts, alertas: ['Presión estática excede el resorte'],
    tanques: [
      { tanqueId: 't1', mi: 0, mf: 0, dif: 0, th, reductor: 0, bph: 0, bpd: 0, aysBls: 0, netos: 0 },
      { tanqueId: 't2', mi: 0, mf: mf2, dif: mf2, th, reductor: 0, bph: bph2, bpd: bph2 * 24, aysBls: bph2 * 24 * 0.22, netos: bph2 * 24 * 0.78, ...(trasegado2 ? { trasegado: trasegado2 } : {}) },
    ],
    gas: { pf: 300, hw: 43.56, tGas: 130, gg: 0.72, diam: 3.25, meterRun: 3.826, beta: 0.85, Fc: 1, Fb: 1, Fg: 1, Ftf: 1, qg: 9.65 },
    operativos: { pCab: 540, pSep: 300, pCsg: 12, reductorPulgadas: '1"' },
  } as any
}
const d = (dia: number, h: number, m = 0) => new Date(2026, 10, dia, h, m)

// Día 4: 3 lecturas (5.2, 5.2, 6.5 Bls/h = 16.9 Bls). Día 5: 2 lecturas (5.2 y 5.2 = 10.4 Bls), con un trasegado de 70 Bls.
const EVAL_A = { id: 'A', creadoEn: d(4, 8), estado: 'OFICIAL', lecturas: [lectura(1, d(4, 9, 7), 5.2, 1), lectura(2, d(4, 10, 3), 5.2, 2), lectura(3, d(4, 10, 58), 6.5, 3.25)] }
const EVAL_B = { id: 'B', creadoEn: d(5, 8), estado: 'EN_CURSO', lecturas: [lectura(1, d(5, 9, 0), 5.2, 4.25, 70), lectura(2, d(5, 10, 0), 5.2, 5.25)] }

const hoja = (hojas: { nombre: string; filas: any[][] }[], nombre: string) => hojas.find((h) => h.nombre === nombre)!
const col = (filas: any[][], titulo: string) => filas[0].indexOf(titulo)
/** Filas de datos de la tabla (sin encabezado de página ni pie), con sus títulos. */
function tabla(filas: any[][]) {
  const i = filas.findIndex((f) => f[0] === 'Fecha' && f[1] === 'Hora')
  const fin = filas.findIndex((f, idx) => idx > i && f.length === 0)
  const t = filas.slice(i, fin)
  return { titulos: t[0] as string[], datos: t.slice(1) }
}

describe('helpers de lectura', () => {
  it('desplazado = Σ bph × th por tanque; trasegado y viajes por registro', () => {
    const l = lectura(1, d(4, 9), 5.2, 1, 70, 2)
    expect(desplazadoDeLectura(l)).toBeCloseTo(10.4, 9)
    expect(trasegadoDeLectura(l)).toBe(70)
    expect(viajesDeLectura(l)).toBe(1)
  })
})

describe('Datos de Evaluación Diaria', () => {
  it('el desplazado arranca en 0 y es exclusivo de la prueba: acumula solo sus lecturas', () => {
    const { titulos, datos } = tabla(construirEvaluacionDiaria(pozo(), EVAL_A)[0].filas)
    const total = titulos.indexOf('TOTAL DESPLAZADO (Bls)')
    expect(datos.map((f) => f[total])).toEqual([5.2, 10.4, 16.9]) // empieza en la primera hora de ESTA prueba
  })

  it('no arrastra lo de otras pruebas ni el desplazado inicial del pozo', () => {
    const conBase = pozo('MONAGAS', { desplazadoInicial: 2542.92, desplazadoInicialDesde: d(1, 0) })
    const filas = construirEvaluacionDiaria(conBase, EVAL_B)[0].filas
    const { titulos, datos } = tabla(filas)
    expect(datos.map((f) => f[titulos.indexOf('TOTAL DESPLAZADO (Bls)')])).toEqual([5.2, 10.4])
    expect(filas.find((f) => String(f[0]).startsWith('DESPLAZADO TOTAL DE LA PRUEBA'))![1]).toBe(10.4)
    expect(JSON.stringify(filas)).not.toContain('2542.92')
  })

  it('muestra la hora de inicio de la prueba (primera lectura a la hora entera) y la última lectura', () => {
    const filas = construirEvaluacionDiaria(pozo(), EVAL_A)[0].filas
    const inicio = filas.find((f) => f[0] === 'Inicio de la prueba')!
    expect(inicio[1]).toBe('04/11/2026 09:00') // 9:07 → 09:00
    expect(inicio[4]).toBe('04/11/2026 11:00') // 10:58 → 11:00
    expect(filas.find((f) => f[0] === 'Horas evaluadas')![1]).toBe(3)
  })

  it('cierra con el desplazado total de la prueba, el trasegado y los viajes', () => {
    const filas = construirEvaluacionDiaria(pozo(), EVAL_B)[0].filas
    expect(filas.find((f) => String(f[0]).startsWith('DESPLAZADO TOTAL DE LA PRUEBA'))![1]).toBe(10.4)
    expect(filas.find((f) => String(f[0]).startsWith('Total trasegado'))![1]).toBe(70)
    expect(filas.find((f) => String(f[0]).startsWith('Viajes de vacuum'))![1]).toBe(1)
  })

  it('hora entera más cercana y fecha solo en la primera fila del día', () => {
    const { datos } = tabla(construirEvaluacionDiaria(pozo(), EVAL_A)[0].filas)
    expect(datos.map((f) => f[1])).toEqual(['09:00', '10:00', '11:00'])
    expect(datos.map((f) => f[0])).toEqual(['04/11/2026', '', ''])
  })

  it('columnas de la planilla: existencia neta, trasegado, total trasegado, viajes y BSW', () => {
    const { titulos, datos } = tabla(construirEvaluacionDiaria(pozo(), EVAL_B)[0].filas)
    const f1 = datos[0]
    expect(f1[titulos.indexOf('Exist. Neta (Bls)')]).toBeCloseTo(4.25 * 5.2, 6)
    expect(f1[titulos.indexOf('Trasegado de la hora (Bls)')]).toBe(70)
    expect(f1[titulos.indexOf('Total Trasegado (Bls)')]).toBe(70)
    expect(f1[titulos.indexOf('Viajes Vacuum (acum.)')]).toBe(1)
    expect(f1[titulos.indexOf('BSW (%)')]).toBe(22)
    expect(f1[titulos.indexOf('T2 Volumen (Bls)')]).toBeCloseTo(22.1, 6)
    expect(datos[1][titulos.indexOf('Viajes Vacuum (acum.)')]).toBe(1) // acumulado: no suma si no hubo otro viaje
  })

  it('Norte de Monagas: sin Casing ni Netos; Faja los conserva', () => {
    const m = tabla(construirEvaluacionDiaria(pozo('MONAGAS'), EVAL_A)[0].filas).titulos
    expect(m).not.toContain('P. Casing (psi)')
    expect(m).not.toContain('Netos (Bls)')
    const f = tabla(construirEvaluacionDiaria(pozo('FAJA'), EVAL_A)[0].filas).titulos
    expect(f).toContain('P. Casing (psi)')
    expect(f).toContain('Netos (Bls)')
  })

  it('NO exporta las alertas operativas', () => {
    expect(JSON.stringify(construirEvaluacionDiaria(pozo('FAJA'), EVAL_A))).not.toMatch(/alerta|excede el resorte/i)
  })

  it('segunda hoja opcional con el reporte del día', () => {
    expect(construirEvaluacionDiaria(pozo(), EVAL_A)).toHaveLength(1)
    const con = construirEvaluacionDiaria(pozo(), EVAL_A, [['GERENCIA DE PRODUCCIÓN DIV PDM'], ['Pozo', 'SBC-61 L']])
    expect(con.map((h) => h.nombre)).toEqual(['Evaluación diaria', 'Reporte'])
  })

  it('sin lecturas no falla: desplazado 0', () => {
    const filas = construirEvaluacionDiaria(pozo(), { id: 'X', creadoEn: d(6, 8), lecturas: [] })[0].filas
    expect(filas.find((f) => String(f[0]).startsWith('DESPLAZADO TOTAL DE LA PRUEBA'))![1]).toBe(0)
    expect(filas.find((f) => f[0] === 'Inicio de la prueba')![1]).toBe('—')
  })

  it('un día con dos lecturas que cruzan la medianoche cambia de fecha', () => {
    const e = { id: 'C', creadoEn: d(4, 22), lecturas: [lectura(1, d(4, 23, 10), 5.2, 1), lectura(2, d(5, 0, 5), 5.2, 2)] }
    const { datos } = tabla(construirEvaluacionDiaria(pozo(), e)[0].filas)
    expect(datos.map((f) => f[0])).toEqual(['04/11/2026', '05/11/2026'])
    expect(datos.map((f) => f[1])).toEqual(['23:00', '00:00'])
  })
})

describe('Data Histórica del Equipo', () => {
  it('acumula el desplazado de TODAS las evaluaciones en orden cronológico (aunque lleguen desordenadas)', () => {
    const hojas = construirHistoricoEquipo(pozo(), [EVAL_B, EVAL_A])
    const { titulos, datos } = tabla(hoja(hojas, 'Data histórica').filas)
    const total = titulos.indexOf('TOTAL DESPLAZADO (Bls)')
    expect(datos.map((f) => f[total])).toEqual([5.2, 10.4, 16.9, 22.1, 27.3])
    expect(datos.map((f) => f[titulos.indexOf('Evaluación')])).toEqual([1, 1, 1, 2, 2])
  })

  it('parte del desplazado inicial del pozo y suma lo registrado desde la fecha de corte', () => {
    const p = pozo('MONAGAS', { desplazadoInicial: 2542.92, desplazadoInicialDesde: d(1, 0) })
    const { titulos, datos } = tabla(hoja(construirHistoricoEquipo(p, [EVAL_A, EVAL_B]), 'Data histórica').filas)
    const total = titulos.indexOf('TOTAL DESPLAZADO (Bls)')
    expect(datos[0][total]).toBeCloseTo(2542.92 + 5.2, 6)
    expect(datos[datos.length - 1][total]).toBeCloseTo(2542.92 + 27.3, 6)
  })

  it('"a partir de ahora": las lecturas ANTERIORES a la fecha de corte no se suman (ya están en el desplazado inicial)', () => {
    const p = pozo('MONAGAS', { desplazadoInicial: 1000, desplazadoInicialDesde: d(5, 0) }) // la evaluación A (día 4) queda fuera
    const hojas = construirHistoricoEquipo(p, [EVAL_A, EVAL_B])
    const { datos } = tabla(hoja(hojas, 'Data histórica').filas)
    expect(datos).toHaveLength(2) // solo las del día 5
    const filas = hoja(hojas, 'Data histórica').filas
    expect(filas.find((f) => String(f[0]).startsWith('DESPLAZADO TOTAL DEL EQUIPO'))![1]).toBe(1010.4)
    expect(hoja(hojas, 'Resumen por evaluación').filas).toHaveLength(2) // encabezado + 1 evaluación
  })

  it('el pie separa lo inicial de lo registrado por la app', () => {
    const p = pozo('MONAGAS', { desplazadoInicial: 2542.92, desplazadoInicialDesde: d(1, 0) })
    const filas = hoja(construirHistoricoEquipo(p, [EVAL_A, EVAL_B]), 'Data histórica').filas
    expect(filas.find((f) => String(f[0]).startsWith('DESPLAZADO TOTAL DEL EQUIPO'))![1]).toBe(2570.22)
    expect(filas.find((f) => String(f[0]).includes('desplazado inicial'))![1]).toBe(2542.92)
    expect(filas.find((f) => String(f[0]).includes('registrado por la app'))![1]).toBe(27.3)
    expect(filas.find((f) => String(f[0]).startsWith('Total trasegado'))![1]).toBe(70)
  })

  it('sin desplazado inicial configurado cuenta desde la primera lectura', () => {
    const filas = hoja(construirHistoricoEquipo(pozo(), [EVAL_A, EVAL_B]), 'Data histórica').filas
    expect(filas.find((f) => f[0] === 'Desplazado inicial (Bls)')).toEqual(['Desplazado inicial (Bls)', 0, '', 'Acumulado desde', 'primera lectura'])
    expect(filas.find((f) => String(f[0]).startsWith('DESPLAZADO TOTAL DEL EQUIPO'))![1]).toBe(27.3)
  })

  it('la fecha de corte puede venir como Timestamp de Firestore', () => {
    const p = pozo('MONAGAS', { desplazadoInicial: 100, desplazadoInicialDesde: { toDate: () => d(5, 0) } as any })
    const filas = hoja(construirHistoricoEquipo(p, [EVAL_A, EVAL_B]), 'Data histórica').filas
    expect(filas.find((f) => String(f[0]).startsWith('DESPLAZADO TOTAL DEL EQUIPO'))![1]).toBe(110.4)
  })

  it('hoja "Resumen por evaluación": una fila por evaluación con su desplazado y el acumulado al cierre', () => {
    const p = pozo('MONAGAS', { desplazadoInicial: 1000, desplazadoInicialDesde: d(1, 0) })
    const resumen = hoja(construirHistoricoEquipo(p, [EVAL_A, EVAL_B]), 'Resumen por evaluación').filas
    expect(resumen[0]).toContain('Desplazado de la evaluación (Bls)')
    expect(resumen).toHaveLength(3)
    const iDesp = resumen[0].indexOf('Desplazado de la evaluación (Bls)')
    const iAcum = resumen[0].indexOf('Desplazado acumulado al cierre (Bls)')
    expect(resumen[1][iDesp]).toBe(16.9)
    expect(resumen[1][iAcum]).toBe(1016.9)
    expect(resumen[2][iDesp]).toBe(10.4)
    expect(resumen[2][iAcum]).toBe(1027.3)
    expect(resumen[1][resumen[0].indexOf('Estado')]).toBe('OFICIAL')
    expect(resumen[2][resumen[0].indexOf('Trasegado (Bls)')]).toBe(70)
    expect(resumen[2][resumen[0].indexOf('Viajes')]).toBe(1)
  })

  it('el viaje y el trasegado son acumulados a lo largo de todas las evaluaciones', () => {
    const { titulos, datos } = tabla(hoja(construirHistoricoEquipo(pozo(), [EVAL_A, EVAL_B]), 'Data histórica').filas)
    expect(datos[datos.length - 1][titulos.indexOf('Total Trasegado (Bls)')]).toBe(70)
    expect(datos[datos.length - 1][titulos.indexOf('Viajes Vacuum (acum.)')]).toBe(1)
  })

  it('sin evaluaciones no falla', () => {
    const hojas = construirHistoricoEquipo(pozo('MONAGAS', { desplazadoInicial: 500 }), [])
    expect(hoja(hojas, 'Data histórica').filas.find((f) => String(f[0]).startsWith('DESPLAZADO TOTAL DEL EQUIPO'))![1]).toBe(500)
    expect(hoja(hojas, 'Resumen por evaluación').filas).toHaveLength(1)
  })

  it('NO exporta alertas; Norte de Monagas sin Casing ni Netos', () => {
    const hojas = construirHistoricoEquipo(pozo('MONAGAS'), [EVAL_A])
    expect(JSON.stringify(hojas)).not.toMatch(/alerta|excede el resorte/i)
    const { titulos } = tabla(hoja(hojas, 'Data histórica').filas)
    expect(titulos).not.toContain('P. Casing (psi)')
    expect(titulos).not.toContain('Netos (Bls)')
  })
})

describe('los dos formatos son independientes y coherentes', () => {
  it('el desplazado de la evaluación diaria coincide con el de esa evaluación en el histórico (sin base)', () => {
    const diaria = construirEvaluacionDiaria(pozo(), EVAL_B)[0].filas.find((f) => String(f[0]).startsWith('DESPLAZADO TOTAL DE LA PRUEBA'))![1]
    const resumen = hoja(construirHistoricoEquipo(pozo(), [EVAL_A, EVAL_B]), 'Resumen por evaluación').filas
    expect(resumen[2][resumen[0].indexOf('Desplazado de la evaluación (Bls)')]).toBe(diaria)
  })

  it('los títulos de página son distintos para cada formato', () => {
    expect(construirEvaluacionDiaria(pozo(), EVAL_A)[0].filas[1][0]).toBe('DATOS DE EVALUACIÓN DIARIA')
    expect(construirHistoricoEquipo(pozo(), [EVAL_A])[0].filas[1][0]).toBe('DATA HISTÓRICA DEL EQUIPO')
  })
})
