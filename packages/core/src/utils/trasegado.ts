// packages/core/src/utils/trasegado.ts
//
// Resumen de lo trasegado (retirado por vacuum) en un ciclo, para las dos ventanas de la pantalla Registro:
// "Total trasegado" y "Número de viajes" (corrección pedida por el cliente, 2026-11-15).
//
// Sale AUTOMÁTICO de lo ya capturado: cada lectura guarda, por tanque, el campo opcional `trasegado` (Bls que un
// viaje de vacuum retiró de ese tanque desde la lectura anterior; solo se guarda si > 0, ver ILecturaTanque).
//   - Total trasegado = suma de esos barriles en todas las lecturas del ciclo.
//   - Número de viajes = cuántas veces se registró un trasegado (un registro por tanque y lectura). Si en un mismo
//     intervalo pasaron dos camiones por el mismo tanque se anotan sumados y cuentan como uno.
// Sin imports relativos a propósito: así se puede importar suelto (@core/utils/trasegado) desde Jest.

export interface ResumenTrasegado {
  /** Barriles trasegados (Bls). */
  totalBls: number
  /** Veces que se registró un trasegado. */
  viajes: number
}

/** Mínimo que se necesita de una lectura (sirve igual para las del ciclo y para lo que aún no se guarda). */
export interface LecturaConTrasegado {
  tanques: { trasegado?: number }[]
}

export function resumenTrasegado(lecturas: LecturaConTrasegado[]): ResumenTrasegado {
  let totalBls = 0
  let viajes = 0
  for (const lectura of lecturas) {
    for (const tanque of lectura.tanques) {
      const bls = tanque.trasegado
      if (typeof bls === 'number' && Number.isFinite(bls) && bls > 0) {
        totalBls += bls
        viajes++
      }
    }
  }
  return { totalBls, viajes }
}
