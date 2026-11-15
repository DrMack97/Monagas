// src/utils/fechaInput.ts
//
// Convierte una fecha guardada (Date, Timestamp de Firestore o texto ISO) al formato de un <input type="datetime-local">
// ("YYYY-MM-DDTHH:mm", hora LOCAL del teléfono). Se usa para el prefill de las fechas del reporte: Firestore guarda
// las fechas como Timestamp y el campo de la pantalla trabaja con texto.

function aDate(valor: unknown): Date | null {
  if (valor === null || valor === undefined || valor === '') return null
  const v = valor as { toDate?: () => Date }
  const d = typeof v.toDate === 'function' ? v.toDate() : valor instanceof Date ? valor : new Date(valor as string | number)
  return Number.isFinite(d.getTime()) ? d : null
}

const dos = (n: number) => String(n).padStart(2, '0')

/** "2026-10-09T09:00" para el campo datetime-local, o undefined si el valor no es una fecha válida. */
export function aInputDatetimeLocal(valor: unknown): string | undefined {
  const d = aDate(valor)
  if (!d) return undefined
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}T${dos(d.getHours())}:${dos(d.getMinutes())}`
}
