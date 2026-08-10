// packages/core/src/calculos/promedio.ts
//
// Calcula el promedio de producción de una evaluación a partir de sus
// lecturas horarias. Se usa en DOS escenarios, con el mismo cálculo:
//
//   1. Cierre normal — cuando horasEvaluadas >= horasEval del pozo,
//      se marca tipoCalculo: 'FINAL_24H'.
//   2. Promedio forzado — bajo demanda, ANTES de completar el ciclo
//      (botón en ReportePage), se marca tipoCalculo: 'PRELIMINAR_FORZADO'.
//
// La función en sí NO decide qué tipo es — solo promedia lo que se le
// entregue. Quien la invoca decide el tipoCalculo según el contexto
// (ver ReportePage.tsx).

import type { ILectura } from '../types/database.js'

export interface PromedioEvaluacion {
  bpdPromedio: number
  netosPromedio: number
  qgPromedio: number
  aysBls: number
  horasTotales: number
  proyeccion24H: number
}

export function calcularPromedioEvaluacion(lecturas: ILectura[]): PromedioEvaluacion {
  if (lecturas.length === 0) {
    return { bpdPromedio: 0, netosPromedio: 0, qgPromedio: 0, aysBls: 0, horasTotales: 0, proyeccion24H: 0 }
  }

  let sumaBph = 0
  let sumaBpd = 0
  let sumaNetos = 0
  let sumaAysBls = 0
  let sumaQg = 0
  let lecturasConGas = 0

  for (const lectura of lecturas) {
    // Suma entre tanques dentro de la misma lectura horaria
    const bphHora = lectura.tanques.reduce((acc, t) => acc + t.bph, 0)
    const bpdHora = lectura.tanques.reduce((acc, t) => acc + t.bpd, 0)
    const netosHora = lectura.tanques.reduce((acc, t) => acc + t.netos, 0)
    const aysHora = lectura.tanques.reduce((acc, t) => acc + t.aysBls, 0)

    sumaBph += bphHora
    sumaBpd += bpdHora
    sumaNetos += netosHora
    sumaAysBls += aysHora

    if (lectura.gas) {
      sumaQg += lectura.gas.qg
      lecturasConGas++
    }
  }

  const n = lecturas.length
  const bphPromedio = sumaBph / n

  return {
    bpdPromedio: sumaBpd / n,
    netosPromedio: sumaNetos / n,
    qgPromedio: lecturasConGas > 0 ? sumaQg / lecturasConGas : 0,
    aysBls: sumaAysBls / n,
    horasTotales: n,
    proyeccion24H: bphPromedio * 24,
  }
}
