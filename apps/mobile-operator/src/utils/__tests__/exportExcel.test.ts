// src/utils/__tests__/exportExcel.test.ts
//
// El Excel sale hacia el cliente (Informe Técnico Willytank, 04/11/2026):
//  - las alertas operativas NO se exportan (son solo de control interno);
//  - la hora va a la hora entera más cercana y la fecha solo en la primera fila de cada día;
//  - Casing y la columna Netos solo en zonas que los usan (Faja), no en Norte de Monagas.

import { exportarInformeExcel } from '../exportExcel'

const hojas: Record<string, any> = {}
jest.mock('xlsx', () => ({
  utils: {
    aoa_to_sheet: (aoa: unknown[][]) => ({ aoa }),
    json_to_sheet: (rows: Record<string, unknown>[]) => ({ rows }),
    book_new: () => ({}),
    book_append_sheet: (_wb: unknown, hoja: unknown, nombre: string) => { hojas[nombre] = hoja },
  },
  writeFile: jest.fn(),
}))

function lectura(hora: number, fecha: Date, extra: Record<string, unknown> = {}) {
  return {
    id: `l${hora}`,
    hora,
    timestamp: fecha,
    tanques: [{ tanqueId: 't1', mi: 0, mf: 1, dif: 1, th: 1, reductor: 0, bph: 5.2, bpd: 124.8, aysBls: 0, netos: 12.5 }],
    gas: { pf: 300, hw: 43.56, tGas: 130, gg: 0.72, diam: 3.25, meterRun: 3.826, beta: 0.85, Fc: 1.2, Fb: 1, Fg: 1, Ftf: 1, qg: 9.65 },
    operativos: { pCab: 540, pSep: 300, pCsg: 12, reductorPulgadas: '1"' },
    alertas: ['Presión estática (350 psig) excede el resorte configurado (300 psi)'],
    ...extra,
  }
}

const resultados = { bpdPromedio: 124.8, netosPromedio: 12.5, qgPromedio: 9.65, aysBls: 0, horasTotales: 3, proyeccion24H: 124.8, tipoCalculo: 'FINAL_24H', calculadoEn: new Date() }

const LECTURAS = [
  lectura(1, new Date(2026, 10, 4, 8, 52)),
  lectura(2, new Date(2026, 10, 4, 23, 7)),
  lectura(3, new Date(2026, 10, 5, 0, 5)),
]

async function exportar(zona: string) {
  await exportarInformeExcel({
    pozo: { id: 'p1', nombre: 'SBC-61', campo: 'Bare', zona, meterRun: 3.826, diamOrif: 3.25, tanques: [{ id: 't1', nombre: 'Tanque 1', mi: 0, ft: 2.4 }] } as any,
    resultados: resultados as any,
    lecturas: LECTURAS as any,
    supervisorArea: 'Fulano',
  })
  return { filas: hojas['Lecturas'].rows as Record<string, unknown>[], resumen: hojas['Resumen'].aoa as unknown[][] }
}

describe('hoja Resumen = reporte estándar', () => {
  it('lleva el encabezado y los bloques del reporte estándar, con Qg en MMSCFD', async () => {
    const { resumen } = await exportar('MONAGAS')
    const etiquetas = resumen.map((r) => r[0])
    expect(etiquetas[0]).toBe('GERENCIA DE PRODUCCIÓN DIV PDM')
    expect(etiquetas).toContain('MEDICIÓN Y CAUDAL DE GAS')
    expect(etiquetas).toContain('CONTROL DE VACUUM Y DISPOSICIÓN')
    expect(resumen).toContainEqual(['Caudal de Gas (Qg)', '9.65 MMSCFD'])
    expect(resumen).toContainEqual(['Supervisor de Área', 'Fulano'])
  })
})

describe('exportarInformeExcel (Operador)', () => {
  it('NO exporta las alertas operativas (ni en Lecturas ni en Resumen)', async () => {
    const { filas, resumen } = await exportar('MONAGAS')
    for (const f of filas) expect(Object.keys(f)).not.toContain('Alertas')
    expect(JSON.stringify(filas)).not.toMatch(/excede el resorte/i)
    expect(JSON.stringify(resumen)).not.toMatch(/alerta|excede el resorte/i)
  })

  it('hora entera más cercana y fecha solo al comenzar cada día', async () => {
    const { filas } = await exportar('MONAGAS')
    expect(filas.map((f) => f.Hora)).toEqual(['09:00', '23:00', '00:00'])
    expect(filas.map((f) => f.Fecha)).toEqual(['04/11/2026', '', '05/11/2026'])
  })

  it('Norte de Monagas: sin columna Netos ni Casing, ni P.Csg en el resumen', async () => {
    const { filas, resumen } = await exportar('MONAGAS')
    for (const f of filas) {
      expect(Object.keys(f)).not.toContain('Netos (Bls)')
      expect(Object.keys(f)).not.toContain('P. Casing (psi)')
    }
    expect(resumen.map((r) => r[0])).not.toContain('P.Csg')
    expect(filas[0]['Qg (MMSCFD)']).toBe(9.65)
  })

  it('Faja: conserva Netos y Casing en la hoja Lecturas', async () => {
    const { filas, resumen } = await exportar('FAJA')
    expect(filas[0]['Netos (Bls)']).toBe(12.5)
    expect(filas[0]['P. Casing (psi)']).toBe(12)
    expect(resumen.map((r) => r[0])).not.toContain('P.Csg') // el reporte estándar no lleva Casing
    expect(Object.keys(filas[0])).not.toContain('Alertas') // las alertas fuera en TODAS las zonas
  })
})
