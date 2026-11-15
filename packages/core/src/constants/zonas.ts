// packages/core/src/constants/zonas.ts
//
// Qué campos se capturan y se muestran en cada zona. Se oculta, no se borra: cada zona opera distinto
// (Informe Técnico Willytank, 04/11/2026) y el código queda por si una zona los vuelve a usar.
//
//   MONAGAS (Norte de Monagas, Div. PDM): sin Casing Gas y sin la columna Netos (Bls) en las lecturas.
//   FAJA (Faja Petrolífera del Orinoco): conserva ambos.
//
// Una zona desconocida (pozo aún cargando, 'TODOS') usa la configuración de MONAGAS, la zona en operación.
// Sin imports relativos a propósito: así se puede importar suelto (@core/constants/zonas) desde Jest.

export interface CapacidadesZona {
  /** Mostrar la columna/campo Netos (Bls) en la tabla de lecturas y en la captura. */
  netosEnLecturas: boolean
  /** Capturar la presión de casing (P. Casing) en el formulario del Operador. */
  casing: boolean
}

const MONAGAS: CapacidadesZona = { netosEnLecturas: false, casing: false }
const FAJA: CapacidadesZona = { netosEnLecturas: true, casing: true }

export function capacidadesZona(zona?: string | null): CapacidadesZona {
  return zona === 'FAJA' ? FAJA : MONAGAS
}
