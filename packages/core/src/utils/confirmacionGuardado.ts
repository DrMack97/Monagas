// packages/core/src/utils/confirmacionGuardado.ts
//
// ¿Hay que pedir confirmación antes de guardar la lectura? Se pide cuando hay algo que probablemente sea un error de
// captura: datos críticos en 0, un valor fuera de rango (utils/rangos.ts) o una discrepancia ROJA del balance de masas.
// No impide guardar: solo obliga a una segunda pulsación consciente ("Guardar de todos modos"). Las alertas amarillas
// del balance y los saltos de producción no piden confirmación (siguen siendo avisos, como se acordó).
// Sin imports relativos a propósito: así se puede importar suelto (@core/utils/confirmacionGuardado) desde Jest.

export interface EntradaConfirmacion {
  /** Etiquetas de los datos críticos en 0 (ver lecturaVacia.ts); vacío si no hay. */
  camposEnCero: string[]
  /** Textos de los avisos de rango (ver rangos.ts). */
  rangos: string[]
  /** Textos de las discrepancias ROJAS del balance de masas. */
  balanceRojo: string[]
}

/** Los motivos por los que se pide confirmar; lista vacía = se guarda directo. */
export function motivosDeConfirmacion(e: EntradaConfirmacion): string[] {
  const motivos: string[] = []
  if (e.camposEnCero.length > 0) motivos.push(`Datos críticos en 0: ${e.camposEnCero.join(', ')}.`)
  motivos.push(...e.rangos)
  motivos.push(...e.balanceRojo)
  return motivos
}
