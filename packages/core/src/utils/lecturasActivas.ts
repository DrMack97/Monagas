// packages/core/src/utils/lecturasActivas.ts
//
// Las lecturas ANULADAS por el Operador no se borran (quedan como constancia) pero no cuentan en ningún cálculo.
// Este es el único lugar que decide cuáles cuentan: promedios, balance de masas, trasegado, tabla, reporte, Excel y el
// trigger de Cloud Functions lo usan, para que una lectura anulada no se cuele por un camino olvidado.
// Sin imports relativos a propósito: así se puede importar suelto (@core/utils/lecturasActivas) desde Jest.

export function lecturaActiva(l: { anulada?: boolean }): boolean {
  return !l.anulada
}

/** Las lecturas que cuentan (no anuladas), en el mismo orden. */
export function lecturasActivas<T extends { anulada?: boolean }>(lecturas: T[]): T[] {
  return lecturas.filter(lecturaActiva)
}

/** Las lecturas anuladas, en el mismo orden. */
export function lecturasAnuladas<T extends { anulada?: boolean }>(lecturas: T[]): T[] {
  return lecturas.filter((l) => !lecturaActiva(l))
}
