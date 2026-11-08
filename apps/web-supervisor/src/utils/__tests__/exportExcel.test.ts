// src/utils/__tests__/exportExcel.test.ts
//
// Mismo contrato que el exportable del Operador (ver mobile-operator): el Excel del informe oficial
// también sale hacia el cliente, así que no lleva alertas, usa hora entera y respeta la zona.

import { exportarInformeOficialExcel } from '../exportExcel'

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

function lectura(hora: number, fecha: Date) {
  return {
    id: `l${hora}`,
    hora,
    timestamp: fecha,
    tanques: [{ tanqueId: 't1', mi: 0, mf: 1, dif: 1, th: 1, reductor: 0, bph: 5.2, bpd: 124.8, aysBls: 0, netos: 12.5 }],
    gas: { pf: 300, hw: 43.56, tGas: 130, gg: 0.72, diam: 3.25, meterRun: 3.826, beta: 0.85, Fc: 1.2, Fb: 1, Fg: 1, Ftf: 1, qg: 9.65 },
    operativos: { pCab: 540, pSep: 300, pCsg: 12, reductorPulgadas: '1"' },
    alertas: ['Diferencial (70 inH₂O) excede el gamma configurado (60 inH₂O)'],
  }
}

const evaluacion = {
  id: 'e1',
  estado: 'OFICIAL',
  fechaCierre: new Date(2026, 10, 5, 9, 0),
  fechaInicio: new Date(2026, 10, 4, 9, 0),
  resultados: { bpdPromedio: 124.8, netosPromedio: 12.5, qgPromedio: 9.65, aysBls: 0, horasTotales: 3, proyeccion24H: 124.8 },
}

const LECTURAS = [lectura(1, new Date(2026, 10, 4, 8, 52)), lectura(2, new Date(2026, 10, 5, 0, 5))]

function exportar(zona: string) {
  exportarInformeOficialExcel({
    pozo: { id: 'p1', nombre: 'SBC-61', campo: 'Bare', zona } as any,
    evaluacion: evaluacion as any,
    lecturas: LECTURAS as any,
  })
  return { filas: hojas['Lecturas'].rows as Record<string, unknown>[], resumen: hojas['Resumen'].aoa as unknown[][] }
}

describe('exportarInformeOficialExcel (panel)', () => {
  it('NO exporta las alertas operativas', () => {
    const { filas, resumen } = exportar('MONAGAS')
    for (const f of filas) expect(Object.keys(f)).not.toContain('Alertas')
    expect(JSON.stringify(filas)).not.toMatch(/excede el gamma/i)
    expect(JSON.stringify(resumen)).not.toMatch(/alerta|excede el gamma/i)
  })

  it('hora entera más cercana y fecha solo al comenzar cada día', () => {
    const { filas } = exportar('MONAGAS')
    expect(filas.map((f) => f.Hora)).toEqual(['09:00', '00:00'])
    expect(filas.map((f) => f.Fecha)).toEqual(['04/11/2026', '05/11/2026'])
  })

  it('Norte de Monagas: sin Netos ni Casing; Faja los conserva', () => {
    const monagas = exportar('MONAGAS')
    expect(Object.keys(monagas.filas[0])).not.toContain('Netos (Bls)')
    expect(Object.keys(monagas.filas[0])).not.toContain('P. Casing (psi)')
    expect(monagas.resumen.map((r) => r[0])).not.toContain('P.Csg')

    const faja = exportar('FAJA')
    expect(faja.filas[0]['Netos (Bls)']).toBe(12.5)
    expect(faja.filas[0]['P. Casing (psi)']).toBe(12)
    expect(faja.resumen.map((r) => r[0])).toContain('P.Csg')
  })
})
