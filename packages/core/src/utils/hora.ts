// packages/core/src/utils/hora.ts
//
// Hora entera de una lectura para mostrar y reportar.
//
// Los operadores toman la lectura a "las 9" pero la guardan a las 9:07 o a las 8:52; si cada reporte
// mostrara el minuto real, la misma lectura aparecería con horas distintas según quién la envíe.
// Regla acordada (Informe Técnico Willytank, 04/11/2026, aclarada por el usuario): se redondea a la
// HORA ENTERA MÁS CERCANA — minutos 00–29 → esa hora, 30–59 → la siguiente (8:52 → 9:00, 9:07 → 9:00).
//
// El timestamp real de la lectura NO se modifica (auditoría): esto es solo para presentarla.
// Sin imports relativos a propósito: así se puede importar suelto (@core/utils/hora) desde Jest.

export function redondearAHoraEntera(fecha: Date): Date {
  const sube = fecha.getMinutes() >= 30
  // El constructor normaliza el desborde (23:52 → 00:00 del día siguiente).
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), fecha.getHours() + (sube ? 1 : 0), 0, 0, 0)
}

/** "HH:00" de la hora entera más cercana — para columnas donde la fecha se muestra aparte. */
export function horaEnteraTexto(fecha: Date): string {
  return `${String(redondearAHoraEntera(fecha).getHours()).padStart(2, '0')}:00`
}
