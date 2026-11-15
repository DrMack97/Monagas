// src/utils/__tests__/exportExcel.test.ts
//
// Los dos Excel independientes (Evaluación diaria / Data histórica del equipo), con la librería xlsx REAL (solo se
// intercepta la entrega del archivo). La estructura de cada hoja se prueba a fondo en el núcleo (exportesExcel.test.ts);
// aquí se comprueba el libro que se genera y se entrega: nombres de archivo y de hojas, valores y reglas del informe.

import * as XLSX from 'xlsx'
import { exportarEvaluacionDiaria, exportarHistoricoEquipo } from '../exportExcel'

const entregar = jest.fn()
jest.mock('../guardarArchivo', () => ({ entregarLibroExcel: (...a: unknown[]) => entregar(...a) }))

const tanque = (id: string, mf: number, bph: number, trasegado?: number) => ({ tanqueId: id, mi: 0, mf, dif: mf, th: 1, reductor: 0, bph, bpd: bph * 24, aysBls: bph * 24 * 0.22, netos: bph * 24 * 0.78, ...(trasegado ? { trasegado } : {}) })
const lectura = (hora: number, ts: Date, bph: number, mf: number, trasegado?: number) => ({
  id: `l${hora}`, hora, timestamp: ts, alertas: ['Presión estática (350 psig) excede el resorte configurado (300 psi)'],
  tanques: [tanque('t1', 0, 0), tanque('t2', mf, bph, trasegado)],
  gas: { pf: 300, hw: 43.56, tGas: 130, gg: 0.72, diam: 3.25, meterRun: 3.826, beta: 0.85, Fc: 1, Fb: 1, Fg: 1, Ftf: 1, qg: 9.65 },
  operativos: { pCab: 540, pSep: 300, pCsg: 12, reductorPulgadas: '1"' },
})

const pozo = (zona = 'MONAGAS', extra = {}) =>
  ({ id: 'p1', nombre: 'SBC-61 L', campo: 'Bare', zona, empresa: 'DSI', equipo: 'WT 1440', meterRun: 3.826, diamOrif: 3.25, tanques: [{ id: 't1', nombre: 'Tanque 1', mi: 0, ft: 5.2 }, { id: 't2', nombre: 'Tanque 2', mi: 0, ft: 5.2 }], ...extra }) as any

const RESULTADOS: any = { bpdPromedio: 124.8, netosPromedio: 97.3, qgPromedio: 9.65, aysBls: 27.4, horasTotales: 2, proyeccion24H: 124.8, tipoCalculo: 'PRELIMINAR_FORZADO', calculadoEn: new Date() }
const LECTURAS = [lectura(1, new Date(2026, 10, 4, 8, 52), 5.2, 1), lectura(2, new Date(2026, 10, 4, 10, 7), 5.2, 2)] as any
const EVALUACIONES = [
  { id: 'A', creadoEn: new Date(2026, 10, 4, 8), estado: 'OFICIAL', lecturas: LECTURAS },
  { id: 'B', creadoEn: new Date(2026, 10, 5, 8), estado: 'EN_CURSO', lecturas: [lectura(1, new Date(2026, 10, 5, 9, 0), 5.2, 3, 70)] as any },
]

/** Lee el libro que se entregó, como lo vería el usuario al abrir el archivo. */
function libroEntregado() {
  const [libro, nombre] = entregar.mock.calls[0] as [XLSX.WorkBook, string]
  const aoa = (hoja: string) => XLSX.utils.sheet_to_json<any[]>(libro.Sheets[hoja], { header: 1, defval: '' })
  return { libro, nombre, hojas: libro.SheetNames, aoa }
}

beforeEach(() => entregar.mockReset().mockResolvedValue(undefined))

describe('Excel — Datos de Evaluación Diaria', () => {
  const exportar = (zona = 'MONAGAS') =>
    exportarEvaluacionDiaria({ pozo: pozo(zona), evalId: 'e1', resultados: RESULTADOS, lecturas: LECTURAS, supervisorArea: 'Fulano' })

  it('archivo propio con la fecha de la prueba, y hojas "Evaluación diaria" y "Reporte"', async () => {
    await exportar()
    const { nombre, hojas } = libroEntregado()
    expect(nombre).toBe('Evaluacion_Diaria_SBC-61 L_04-11-2026.xlsx')
    expect(hojas).toEqual(['Evaluación diaria', 'Reporte'])
  })

  it('el desplazado es el de la prueba (arranca en la primera lectura) y el pie lo totaliza', async () => {
    await exportar()
    const filas = libroEntregado().aoa('Evaluación diaria')
    const iTitulos = filas.findIndex((f) => f[0] === 'Fecha' && f[1] === 'Hora')
    const iTotal = filas[iTitulos].indexOf('TOTAL DESPLAZADO (Bls)')
    expect([filas[iTitulos + 1][iTotal], filas[iTitulos + 2][iTotal]]).toEqual([5.2, 10.4])
    expect(filas.find((f) => String(f[0]).startsWith('DESPLAZADO TOTAL DE LA PRUEBA'))![1]).toBe(10.4)
    expect(filas.find((f) => f[0] === 'Inicio de la prueba')![1]).toBe('04/11/2026 09:00') // 8:52 → 09:00
  })

  it('NO exporta las alertas operativas, en ninguna hoja', async () => {
    await exportar('FAJA')
    expect(JSON.stringify(libroEntregado().aoa('Evaluación diaria'))).not.toMatch(/alerta|excede el resorte/i)
    expect(JSON.stringify(libroEntregado().aoa('Reporte'))).not.toMatch(/alerta|excede el resorte/i)
  })

  it('la hoja "Reporte" es el reporte estándar con Qg en MMSCFD, Supervisor de Área y Tipo de Cálculo', async () => {
    await exportar()
    const r = libroEntregado().aoa('Reporte')
    expect(r[0][0]).toBe('GERENCIA DE PRODUCCIÓN DIV PDM')
    expect(r.find((f) => f[0] === 'Caudal de Gas (Qg)')![1]).toBe('9.65 MMSCFD')
    expect(r.find((f) => f[0] === 'Supervisor de Área')![1]).toBe('Fulano')
    expect(r.find((f) => f[0] === 'Tipo de Cálculo')![1]).toBe('Preliminar')
  })

  it('Norte de Monagas: sin Netos ni Casing; Faja los conserva', async () => {
    await exportar('MONAGAS')
    let t = libroEntregado().aoa('Evaluación diaria').find((f) => f[0] === 'Fecha' && f[1] === 'Hora')!
    expect(t).not.toContain('Netos (Bls)')
    expect(t).not.toContain('P. Casing (psi)')
    entregar.mockClear()
    await exportar('FAJA')
    t = libroEntregado().aoa('Evaluación diaria').find((f) => f[0] === 'Fecha' && f[1] === 'Hora')!
    expect(t).toContain('Netos (Bls)')
    expect(t).toContain('P. Casing (psi)')
  })
})

describe('Excel — Data Histórica del Equipo', () => {
  it('archivo propio, distinto del diario, con hojas "Data histórica" y "Resumen por evaluación"', async () => {
    await exportarHistoricoEquipo({ pozo: pozo(), evaluaciones: EVALUACIONES as any })
    const { nombre, hojas } = libroEntregado()
    expect(nombre).toMatch(/^Data_Historica_Equipo_SBC-61 L_\d{2}-\d{2}-\d{4}\.xlsx$/)
    expect(hojas).toEqual(['Data histórica', 'Resumen por evaluación'])
  })

  it('acumula el desplazado de todas las evaluaciones a partir del desplazado inicial del pozo', async () => {
    const p = pozo('MONAGAS', { desplazadoInicial: 2542.92, desplazadoInicialDesde: new Date(2026, 10, 1) })
    await exportarHistoricoEquipo({ pozo: p, evaluaciones: EVALUACIONES as any })
    const filas = libroEntregado().aoa('Data histórica')
    expect(filas.find((f) => String(f[0]).startsWith('DESPLAZADO TOTAL DEL EQUIPO'))![1]).toBe(2542.92 + 15.6) // 3 horas de 5.2 Bls
    expect(filas.find((f) => f[0] === 'Desplazado inicial (Bls)')![1]).toBe(2542.92)
  })

  it('NO exporta alertas y respeta la zona', async () => {
    await exportarHistoricoEquipo({ pozo: pozo('MONAGAS'), evaluaciones: EVALUACIONES as any })
    const filas = libroEntregado().aoa('Data histórica')
    expect(JSON.stringify(filas)).not.toMatch(/alerta|excede el resorte/i)
    const t = filas.find((f) => f[0] === 'Fecha' && f[1] === 'Hora')!
    expect(t).not.toContain('Netos (Bls)')
    expect(t).toContain('Evaluación')
  })

  it('el resumen tiene una fila por evaluación con su desplazado y el acumulado al cierre', async () => {
    await exportarHistoricoEquipo({ pozo: pozo(), evaluaciones: EVALUACIONES as any })
    const r = libroEntregado().aoa('Resumen por evaluación')
    expect(r).toHaveLength(3)
    expect(r[1][r[0].indexOf('Desplazado de la evaluación (Bls)')]).toBe(10.4)
    expect(r[2][r[0].indexOf('Desplazado de la evaluación (Bls)')]).toBe(5.2)
    expect(r[2][r[0].indexOf('Desplazado acumulado al cierre (Bls)')]).toBe(15.6)
  })
})

describe('los dos formatos son archivos distintos e independientes', () => {
  it('cada exportación entrega UN archivo con su propio nombre; no dependen una de otra', async () => {
    await exportarEvaluacionDiaria({ pozo: pozo(), evalId: 'e1', resultados: RESULTADOS, lecturas: LECTURAS, supervisorArea: '' })
    await exportarHistoricoEquipo({ pozo: pozo(), evaluaciones: EVALUACIONES as any })
    expect(entregar).toHaveBeenCalledTimes(2)
    expect(entregar.mock.calls[0][1]).toMatch(/^Evaluacion_Diaria_/)
    expect(entregar.mock.calls[1][1]).toMatch(/^Data_Historica_Equipo_/)
  })
})
