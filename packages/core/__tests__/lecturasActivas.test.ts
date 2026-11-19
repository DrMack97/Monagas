import { describe, it, expect } from 'vitest'
import { lecturasActivas, lecturasAnuladas, lecturaActiva } from '../src/utils/lecturasActivas.js'
import { calcularPromedioEvaluacion } from '../src/calculos/promedio.js'
import { construirEvaluacionDiaria, construirHistoricoEquipo } from '../src/utils/exportesExcel.js'
import type { ILectura } from '../src/types/database.js'

function lectura(hora: number, bph: number, extra: Partial<ILectura> = {}): ILectura {
  return {
    id: `l${hora}`, hora, timestamp: new Date(2026, 10, 4, 8 + hora, 0),
    tanques: [{ tanqueId: 't1', mi: 0, mf: hora, dif: hora, th: 1, reductor: 0, bph, bpd: bph * 24, netos: bph * 24, aysBls: 0 }],
    gas: { pf: 300, hw: 40, tGas: 90, gg: 0.6, diam: 3.25, meterRun: 3.826, beta: 0.85, Fc: 1, Fb: 1, Fg: 1, Ftf: 1, qg: 5 },
    operativos: { pCab: 540, pSep: 120 },
    ...extra,
  }
}
const anulada = (hora: number, bph: number) => lectura(hora, bph, { anulada: true, anuladaPor: 'op1', anuladaMotivo: 'ceros de prueba' })

describe('lecturasActivas / lecturasAnuladas', () => {
  const todas = [lectura(1, 5), anulada(2, 0), lectura(3, 7)]
  it('separan las que cuentan de las anuladas, sin perder ninguna ni cambiar el orden', () => {
    expect(lecturasActivas(todas).map((l) => l.hora)).toEqual([1, 3])
    expect(lecturasAnuladas(todas).map((l) => l.hora)).toEqual([2])
    expect(todas).toHaveLength(3) // no muta
  })
  it('una lectura sin el campo "anulada" (las de siempre) cuenta', () => {
    expect(lecturaActiva(lectura(1, 5))).toBe(true)
    expect(lecturaActiva({ anulada: false })).toBe(true)
    expect(lecturaActiva({ anulada: true })).toBe(false)
  })
})

describe('una lectura anulada NO entra en el promedio', () => {
  it('el promedio con una anulada es idéntico al de las demás solas', () => {
    const con = calcularPromedioEvaluacion([lectura(1, 5), anulada(2, 900), lectura(3, 7)])
    const sin = calcularPromedioEvaluacion([lectura(1, 5), lectura(3, 7)])
    expect(con).toEqual(sin)
    expect(con.horasTotales).toBe(2)
    expect(con.bpdPromedio).toBe(((5 + 7) / 2) * 24)
  })
  it('si todas están anuladas queda en ceros, sin reventar', () => {
    expect(calcularPromedioEvaluacion([anulada(1, 5)]).horasTotales).toBe(0)
  })
})

describe('una lectura anulada NO sale en ningún Excel', () => {
  const pozo: any = { id: 'p', nombre: 'SBC-61 L', campo: 'Bare', zona: 'MONAGAS', empresa: 'DSI', equipo: 'WT', tanques: [{ id: 't1', nombre: 'Tanque 1', mi: 0, ft: 1 }] }
  const filas = (hojas: any[]) => hojas.flatMap((h) => h.filas.map((f: unknown[]) => f.join('|'))).join('\n')

  it('evaluación diaria: las horas evaluadas cuentan solo las activas', () => {
    const h = construirEvaluacionDiaria(pozo, { id: 'e', creadoEn: new Date(2026, 10, 4), estado: 'EN_CURSO', lecturas: [lectura(1, 5), anulada(2, 999), lectura(3, 7)] }, [])
    const t = filas(h)
    expect(t).not.toMatch(/999/)
    expect(h[0].filas.find((f: unknown[]) => f[0] === 'Horas evaluadas')![1]).toBe(2)
  })
  it('histórico: el desplazado total no suma la anulada', () => {
    const base = construirHistoricoEquipo(pozo, [{ id: 'e', creadoEn: new Date(2026, 10, 4), estado: 'OFICIAL', lecturas: [lectura(1, 5), lectura(3, 7)] }])
    const conAnulada = construirHistoricoEquipo(pozo, [{ id: 'e', creadoEn: new Date(2026, 10, 4), estado: 'OFICIAL', lecturas: [lectura(1, 5), anulada(2, 999), lectura(3, 7)] }])
    expect(filas(conAnulada)).toBe(filas(base))
  })
})
