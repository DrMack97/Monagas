// packages/core/src/utils/lecturaVacia.ts
//
// Aviso de "lectura vacía": campos críticos de la lectura que están en 0 (o sin llenar) al momento de guardar.
//
// Una lectura guardada con la Medida Final, la Presión Estática, el Diferencial o las presiones operativas en 0 entra a
// la base de datos como un dato válido: distorsiona los promedios de la evaluación, el Qg, el desplazado y, además, la
// Medida Final guardada pasa a ser la medida INICIAL de la lectura siguiente del tanque. Por eso se avisa en rojo antes
// de guardar. El aviso NO bloquea: un 0 puede ser real (un pozo sin gas, un tanque recién vaciado) y el operador decide.
//
// Qué se considera crítico:
//   · Medida Final de cada tanque.
//   · Presión Estática y Diferencial (solo si el pozo tiene Placa y Meter Run: sin ellos el gas no se guarda).
//   · P. Cabezal y P. Separador.
// No se consideran: Temp. gas y Gravedad específica (tienen valores de partida distintos de 0), AyS, Trasegado y Casing
// (el 0 es lo habitual).
// Sin imports relativos a propósito: así se puede importar suelto (@core/utils/lecturaVacia) desde Jest.

export type CampoCritico =
  | { tipo: 'medidaFinal'; tanqueId: string; etiqueta: string }
  | { tipo: 'pf' | 'hw' | 'pCab' | 'pSep'; etiqueta: string }

export interface DatosCriticos {
  /** Medida final de cada tanque, tal como está escrita (texto del campo). */
  tanques: { id: string; nombre: string; mf: string }[]
  pf: string
  hw: string
  pCab: string
  pSep: string
  /** El pozo tiene Placa y Meter Run: solo entonces la lectura guarda el gas (Pf y Hw importan). */
  gasConfigurado: boolean
}

export interface AvisoLecturaVacia {
  /** Campos críticos en 0 (o vacíos). */
  campos: CampoCritico[]
  /** TODOS los campos críticos están en 0: la lectura está vacía. */
  vacia: boolean
}

/** Un campo está "en 0" si está vacío, no es un número o vale 0. */
export function esCeroOVacio(valor: string): boolean {
  const n = parseFloat(valor)
  return !Number.isFinite(n) || n === 0
}

export function datosCriticosEnCero(d: DatosCriticos): AvisoLecturaVacia {
  const evaluados: { campo: CampoCritico; cero: boolean }[] = []
  for (const t of d.tanques) {
    evaluados.push({ campo: { tipo: 'medidaFinal', tanqueId: t.id, etiqueta: `Medida Final (${t.nombre})` }, cero: esCeroOVacio(t.mf) })
  }
  if (d.gasConfigurado) {
    evaluados.push({ campo: { tipo: 'pf', etiqueta: 'Presión Estática' }, cero: esCeroOVacio(d.pf) })
    evaluados.push({ campo: { tipo: 'hw', etiqueta: 'Diferencial' }, cero: esCeroOVacio(d.hw) })
  }
  evaluados.push({ campo: { tipo: 'pCab', etiqueta: 'P. Cabezal' }, cero: esCeroOVacio(d.pCab) })
  evaluados.push({ campo: { tipo: 'pSep', etiqueta: 'P. Separador' }, cero: esCeroOVacio(d.pSep) })
  return {
    campos: evaluados.filter((e) => e.cero).map((e) => e.campo),
    vacia: evaluados.length > 0 && evaluados.every((e) => e.cero),
  }
}

/** ¿Esta alerta de una lectura es la constancia de "guardada con datos críticos en 0"? */
export function esConstanciaLecturaVacia(alerta: string): boolean {
  return /^Lectura guardada (VACÍA|con datos críticos en 0)/.test(alerta)
}

/** Texto de la constancia interna (lectura.alertas) cuando se guardó con campos críticos en 0. */
export function textoConstanciaLecturaVacia(aviso: AvisoLecturaVacia): string {
  const lista = aviso.campos.map((c) => c.etiqueta).join(', ')
  return aviso.vacia
    ? `Lectura guardada VACÍA: todos los datos críticos están en 0 (${lista}).`
    : `Lectura guardada con datos críticos en 0: ${lista}.`
}
