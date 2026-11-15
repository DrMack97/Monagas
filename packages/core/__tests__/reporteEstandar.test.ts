// Reporte operacional estándar (Informe Técnico Willytank, 04/11/2026, sección 2).
// Caso de oro: el ejemplo del propio informe (SBC-61 L, 04/11/2026 08:00) debe salir línea por línea.

import { describe, it, expect } from 'vitest'
import { construirReporteEstandar, reporteAWhatsApp, reporteAFilasExcel } from '../src/utils/reporteEstandar.js'
import type { DatosReporteEstandar } from '../src/utils/reporteEstandar.js'

function datosEjemplo(): DatosReporteEstandar {
  return {
    ahora: new Date(2026, 10, 4, 7, 57), // 07:57 → hora entera 08:00
    pozo: {
      nombre: 'SBC-61 L',
      empresa: 'DSI',
      equipo: 'Well Testing 1440',
      reductorPulgadas: '1"',
      meterRun: 3.826,
      diamOrif: 3.25,
      tanques: [
        { id: 't1', nombre: 'Tanque 1', mi: 0, ft: 2.4 },
        { id: 't2', nombre: 'Tanque 2', mi: 0, ft: 2.4 },
      ],
    },
    resultados: { proyeccion24H: 124.8, bpdPromedio: 124.8, aysBls: 27.456, qgPromedio: 9.7 },
    lecturas: [
      {
        id: 'l1',
        hora: 1,
        timestamp: new Date(2026, 10, 4, 7, 57),
        tanques: [
          { tanqueId: 't1', mi: 0, mf: 0, dif: 0, th: 1, reductor: 0, bph: 0, bpd: 0, aysBls: 0, netos: 0 },
          { tanqueId: 't2', mi: 0, mf: 48.75, dif: 48.75, th: 1, reductor: 0, bph: 5.2, bpd: 124.8, aysBls: 27.456, netos: 97.344 },
        ],
        gas: { pf: 300, hw: 43.56, tGas: 130, gg: 0.72, diam: 3.25, meterRun: 3.826, beta: 0.849, Fc: 1.4, Fb: 1, Fg: 1, Ftf: 1, qg: 9.8 },
        operativos: { pCab: 540, pSep: 300 },
        alertas: ['Presión estática excede el resorte configurado'],
      },
    ],
    reporte: {
      supervisorPDVSA: 'Nelson Fajardo',
      cuadrillaDiurno: 'Luis Idrogo',
      cuadrillaNocturno: 'Pedro Vargas',
      fechaAlineacion: new Date(2026, 9, 9),
      estadoActual: 'Pozo fluyendo a través del SWT en superficie y quema de gas en sitio.',
      asunto: 'Inicia prueba de producción a las 09:00 am por orden del representante del cliente.',
      plan: 'Evaluar comportamiento operacional de pozo con unidad WT.',
      tipoFluido: { api: 38.6 },
      resumenTanques: { existencia: 117, trasegable: 117, totalTrasegado: 2542.92 },
      nivelCellar: 70,
      viajesVacuum: 22,
      viajesVacuum24h: [{ fechaHora: new Date(2026, 10, 3, 9, 5), chofer: 'Rodolfo Rivas', volumen: 120.9, destino: 'E/F Santa Bárbara' }],
    },
  }
}

describe('reporte estándar de WhatsApp — ejemplo del Informe Técnico', () => {
  const texto = reporteAWhatsApp(construirReporteEstandar(datosEjemplo()))
  const lineas = texto.split('\n')

  it('encabezado', () => {
    expect(lineas.slice(0, 2)).toEqual(['*GERENCIA DE PRODUCCIÓN DIV PDM*', '*REPORTE OPERACIONES DE WT*'])
    for (const l of [
      '*EMPRESA:* DSI',
      '*Equipo:* Well Testing 1440',
      '*Pozo:* SBC-61 L',
      '*Fecha:* 04/11/2026',
      '*Hora:* 08:00 Hrs',
    ]) expect(lineas).toContain(l)
  })

  it('supervisores diurno/nocturno', () => {
    expect(lineas).toContain('*Supv. Producción PDVSA:*')
    expect(lineas).toContain('• Diurno: Nelson Fajardo')
    expect(lineas).toContain('• Nocturno: —') // PDVSA nocturno sin cargar
    expect(lineas).toContain('*Supv. Well Testing (DSI):*')
    expect(lineas).toContain('• Diurno: Luis Idrogo')
    expect(lineas).toContain('• Nocturno: Pedro Vargas')
  })

  it('fechas, estatus, asunto y plan', () => {
    for (const l of [
      '*Fecha Inicio Well Testing:* 09/10/2026',
      '*Fecha Culminación:* En progreso',
      '*ESTATUS ACTUAL:* Pozo fluyendo a través del SWT en superficie y quema de gas en sitio.',
      '*ASUNTO:* Inicia prueba de producción a las 09:00 am por orden del representante del cliente.',
      '*PLAN:* Evaluar comportamiento operacional de pozo con unidad WT.',
    ]) expect(lineas).toContain(l)
  })

  it('parámetros de operación', () => {
    expect(lineas).toContain('*PARÁMETROS DE OPERACIÓN:*')
    expect(lineas).toContain('• P.Cab: 540 PSI | Red: 1" | P.Sep: 300 PSI')
    expect(lineas).toContain('• Caudal Líquido: 5.2 BPH | 124.8 BPD')
    expect(lineas).toContain('• Total Despachado General: 2,659.92 Bls') // 2,542.92 trasegado + 117 existencia
  })

  it('medición y caudal de gas (Qg en MMSCFD)', () => {
    expect(lineas).toContain('*MEDICIÓN Y CAUDAL DE GAS:*')
    expect(lineas).toContain('• Meter Run: 3.826" | Placa Orificio: 3.250"')
    expect(lineas).toContain('• P. Estática: 300 PSI | P. Diferencial: 43.56 inH2O')
    expect(lineas).toContain('• GE Gas: 0.72 | T. Gas: 130 °F')
    expect(lineas).toContain('• Caudal de Gas (Qg): 9.80 MMSCFD')
    expect(lineas).toContain('• Calidad: 38.6 °API | BSW: 22% H2O')
  })

  it('estatus de tanques (existencia = medida final × factor tanque)', () => {
    expect(lineas).toContain('*ESTATUS DE TANQUES DE ALMACENAMIENTO:*')
    expect(lineas).toContain('• Tanque #1: 0 Bls | Tanque #2: 117 Bls')
    expect(lineas).toContain('• Existencia Total: 117 Bls | Total Trasegable: 117 Bls')
    expect(lineas).toContain('• Total Trasegado Acumulado: 2,542.92 Bls')
  })

  it('control de vacuum: el viaje va bajo el conteo y el total de 24 h al final', () => {
    expect(lineas).toContain('*CONTROL DE VACUUM Y DISPOSICIÓN:*')
    const i = lineas.indexOf('• Viajes Vacuum (Últimas 24 Hrs): 01')
    expect(i).toBeGreaterThan(-1)
    expect(lineas[i + 1]).toBe('   - 1er Viaje: [03/11/2026 - 09:05 Hrs] | Chófer: Rodolfo Rivas | Vol: 120.9 Bls | Destino: E/F Santa Bárbara')
    expect(lineas[i + 2]).toBe('• Total Trasegado (24 Hrs): 120.9 BLS')
    expect(lineas).toContain('• Nivel de Celler: 70%')
    expect(lineas).toContain('• Total Viajes Vacuum Acumulados: 22')
  })

  it('NO incluye las alertas operativas', () => {
    expect(texto).not.toMatch(/alerta|excede el resorte/i)
  })
})

describe('reporte estándar — datos faltantes y variantes', () => {
  it('sin dato → "—" (no inventa), culminación → "En progreso"', () => {
    const d = datosEjemplo()
    d.lecturas = []
    d.reporte = {}
    d.pozo = { ...d.pozo, reductorPulgadas: undefined, meterRun: undefined, diamOrif: undefined }
    d.resultados = { proyeccion24H: 0, bpdPromedio: 0, aysBls: 0, qgPromedio: 0 }
    const t = reporteAWhatsApp(construirReporteEstandar(d))
    expect(t).toContain('• P.Cab: — | Red: — | P.Sep: —')
    expect(t).toContain('• Total Despachado General: —')
    expect(t).toContain('• Meter Run: — | Placa Orificio: —')
    expect(t).toContain('• Caudal de Gas (Qg): —')
    expect(t).toContain('• Tanque #1: — | Tanque #2: —')
    expect(t).toContain('*Fecha Culminación:* En progreso')
    expect(t).toContain('• Viajes Vacuum (Últimas 24 Hrs): 00')
    expect(t).toContain('• Total Trasegado (24 Hrs): —')
  })

  it('existencia total = suma de tanques si no se digitó el resumen', () => {
    const d = datosEjemplo()
    d.reporte = { ...d.reporte, resumenTanques: undefined }
    const t = reporteAWhatsApp(construirReporteEstandar(d))
    expect(t).toContain('• Existencia Total: 117 Bls | Total Trasegable: —')
    expect(t).toContain('• Total Trasegado Acumulado: —')
    expect(t).toContain('• Total Despachado General: —') // sin trasegado acumulado no se puede sumar
  })

  it('varios viajes: ordinales y total de 24 h sumado', () => {
    const d = datosEjemplo()
    d.reporte = {
      ...d.reporte,
      viajesVacuum24h: [
        { fechaHora: new Date(2026, 10, 3, 9, 5), chofer: 'A', volumen: 100, destino: 'X' },
        { fechaHora: new Date(2026, 10, 3, 15, 30), chofer: 'B', volumen: 50.5, destino: 'Y' },
        { fechaHora: new Date(2026, 10, 4, 1, 0), chofer: 'C', volumen: 20, destino: 'Z' },
      ],
    }
    const t = reporteAWhatsApp(construirReporteEstandar(d))
    expect(t).toContain('• Viajes Vacuum (Últimas 24 Hrs): 03')
    expect(t).toContain('   - 2do Viaje: [03/11/2026 - 15:30 Hrs] | Chófer: B | Vol: 50.5 Bls | Destino: Y')
    expect(t).toContain('   - 3er Viaje: [04/11/2026 - 01:00 Hrs] | Chófer: C | Vol: 20 Bls | Destino: Z')
    expect(t).toContain('• Total Trasegado (24 Hrs): 170.5 BLS')
  })

  it('fecha de culminación cargada reemplaza "En progreso"', () => {
    const d = datosEjemplo()
    d.reporte = { ...d.reporte, fechaCulminacion: new Date(2026, 10, 6) }
    expect(reporteAWhatsApp(construirReporteEstandar(d))).toContain('*Fecha Culminación:* 06/11/2026')
  })

  it('sin fecha de alineación usa la fecha de inicio de respaldo', () => {
    const d = datosEjemplo()
    d.reporte = { ...d.reporte, fechaAlineacion: undefined }
    d.fechaInicioFallback = new Date(2026, 10, 1)
    expect(reporteAWhatsApp(construirReporteEstandar(d))).toContain('*Fecha Inicio Well Testing:* 01/11/2026')
  })
})

describe('reporte estándar — resumen de tanques parcial', () => {
  it('con solo existencia y trasegable (sin acumulado) no inventa un acumulado en 0: sale "—"', () => {
    const d = datosEjemplo()
    d.reporte = { ...d.reporte, resumenTanques: { existencia: 117, trasegable: 117 } }
    const t = reporteAWhatsApp(construirReporteEstandar(d))
    expect(t).toContain('• Existencia Total: 117 Bls | Total Trasegable: 117 Bls')
    expect(t).toContain('• Total Trasegado Acumulado: —')
    expect(t).toContain('• Total Despachado General: —')
  })

  it('con solo el acumulado, la existencia se calcula de los tanques (no se pone 0)', () => {
    const d = datosEjemplo()
    d.reporte = { ...d.reporte, resumenTanques: { totalTrasegado: 2542.92 } }
    const t = reporteAWhatsApp(construirReporteEstandar(d))
    expect(t).toContain('• Existencia Total: 117 Bls | Total Trasegable: —')
    expect(t).toContain('• Total Trasegado Acumulado: 2,542.92 Bls')
    expect(t).toContain('• Total Despachado General: 2,659.92 Bls')
  })
})

describe('reporte estándar — robustez', () => {
  it('un pozo sin lista de tanques NO rompe el reporte (rompía el botón de Excel)', () => {
    const d = datosEjemplo()
    ;(d.pozo as any).tanques = undefined
    expect(() => reporteAWhatsApp(construirReporteEstandar(d))).not.toThrow()
  })
})

describe('reporteAFilasExcel — mismo contenido que WhatsApp', () => {
  it('cada par etiqueta/valor es una fila y los viajes quedan como detalle', () => {
    const filas = reporteAFilasExcel(construirReporteEstandar(datosEjemplo()))
    expect(filas[0]).toEqual(['GERENCIA DE PRODUCCIÓN DIV PDM'])
    expect(filas).toContainEqual(['Caudal de Gas (Qg)', '9.80 MMSCFD'])
    expect(filas).toContainEqual(['Total Despachado General', '2,659.92 Bls'])
    expect(filas.some((f) => String(f[1]).startsWith('1er Viaje: [03/11/2026 - 09:05 Hrs]'))).toBe(true)
    expect(JSON.stringify(filas)).not.toMatch(/alerta/i)
  })
})
