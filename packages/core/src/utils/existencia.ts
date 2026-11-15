// packages/core/src/utils/existencia.ts
//
// Existencia total medida en los tanques: Σ (medida final de la ÚLTIMA lectura × factor del tanque). Es "el último valor
// ingresado por el operador (medición del tanque en esa hora)" que la ventana Existencia del reporte precarga.
//
// Devuelve undefined si no se puede calcular con certeza (sin lectura, sin tanques, o algún tanque sin medida): en ese
// caso no se precarga nada en vez de inventar un total parcial.
// Sin imports relativos a propósito: así se puede importar suelto (@core/utils/existencia) desde Jest.

export interface TanqueParaExistencia {
  id: string
  /** Factor del tanque kk (Bls por pulgada). */
  ft: number
}

export interface LecturaParaExistencia {
  tanques: { tanqueId: string; mf: number }[]
}

export function existenciaMedida(tanques: TanqueParaExistencia[], ultima: LecturaParaExistencia | undefined): number | undefined {
  if (!ultima || tanques.length === 0) return undefined
  let total = 0
  for (const tanque of tanques) {
    const entrada = ultima.tanques.find((t) => t.tanqueId === tanque.id)
    if (!entrada || !Number.isFinite(entrada.mf) || !Number.isFinite(tanque.ft)) return undefined
    total += entrada.mf * tanque.ft
  }
  return total
}

/** Texto para un campo numérico: sin ceros de más ni errores de coma flotante (117.00000000000001 → "117"). */
export function aTextoBls(n: number): string {
  return String(Number(n.toFixed(2)))
}
