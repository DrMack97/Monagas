// packages/core/src/utils/rangos.ts
//
// Rangos plausibles por pozo: avisa de un valor capturado que está fuera de lo razonable ANTES de guardar la lectura
// (típicamente un decimal omitido: 540 psig escrito como 5400 o 54). Solo avisa; quien guarda decide (ver la
// confirmación en Registro). Cada regla es un cálculo a la vista, sin datos escondidos:
//
//   Físicamente imposible (ROJA)
//     · Un valor negativo (presiones, diferencial, medida del tanque).
//     · Diferencial mayor que la presión estática: la presión diferencial en psi (inH₂O / 27.707) no puede superar la
//       presión estática absoluta aguas arriba; AGA-3 deja de ser válido.
//   Fuera de lo esperado (AMARILLA)
//     · Presión estática por encima del resorte del registrador, o diferencial por encima del gamma (límites que el
//       Supervisor fija en el pozo).
//     · Temperatura del gas fuera de −20 … 300 °F; gravedad específica fuera de 0.4 … 1.5; medida de tanque > 500 pulg.
//     · P. Cabezal menor que P. Separador (el fluido va del cabezal al separador: normalmente el cabezal tiene más).
//     · RANGO HABITUAL DEL POZO: el valor se aparta más de 3 veces (por encima o por debajo) de la mediana de las
//       lecturas recientes del propio pozo. Si el cociente es cercano a 10 (o a 0.1) se sugiere "decimal omitido".
//
// Los umbrales (3×, 500 pulg, rangos de temperatura y gravedad) son una propuesta de ingeniería, no una norma del
// cliente: están en las constantes de abajo para ajustarlos en un solo lugar.
// Los 0 NO se evalúan aquí: los cubre el aviso de "lectura vacía" (utils/lecturaVacia.ts).
// Sin imports relativos a propósito: así se puede importar suelto (@core/utils/rangos) desde Jest.

export const RANGO_FACTOR_HABITUAL = 3
export const MIN_LECTURAS_HABITUAL = 2
export const T_GAS_MIN = -20
export const T_GAS_MAX = 300
export const GE_MIN = 0.4
export const GE_MAX = 1.5
export const MEDIDA_TANQUE_MAX = 500
/** inH₂O por psi (agua a 60 °F). */
export const INH2O_POR_PSI = 27.707

export type NivelRango = 'AMARILLA' | 'ROJA'
export type CampoRango = 'pf' | 'hw' | 'tGas' | 'gg' | 'pCab' | 'pSep' | 'medidaFinal'

export interface AvisoRango {
  campo: CampoRango
  /** Solo para medidaFinal: el tanque. */
  tanqueId?: string
  nivel: NivelRango
  texto: string
}

export interface EntradaRangos {
  gasConfigurado: boolean
  /** Valores tal como están escritos en los campos. */
  pf: string
  hw: string
  tGas: string
  gg: string
  pCab: string
  pSep: string
  tanques: { id: string; nombre: string; mf: string }[]
  /** Límites del registrador Barton del pozo (0 o ausentes = sin límite). */
  limResorte?: number
  limGamma?: number
  /** Valores de las lecturas recientes del pozo (activas), para el rango habitual. Solo cuentan los > 0. */
  historial?: Partial<Record<'pf' | 'hw' | 'pCab' | 'pSep', number[]>>
}

const num = (s: string): number => parseFloat(s)

export function mediana(valores: number[]): number {
  const v = [...valores].sort((a, b) => a - b)
  const m = Math.floor(v.length / 2)
  return v.length % 2 === 0 ? (v[m - 1] + v[m]) / 2 : v[m]
}

const fmt = (n: number): string => (Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, ''))

/** ¿Se aparta del rango habitual del pozo? Devuelve el aviso (texto) o undefined. */
function fueraDeHabitual(etiqueta: string, valor: number, previos: number[] | undefined): string | undefined {
  const base = (previos ?? []).filter((x) => Number.isFinite(x) && x > 0)
  if (!(valor > 0) || base.length < MIN_LECTURAS_HABITUAL) return undefined
  const m = mediana(base)
  const cociente = valor / m
  if (cociente <= RANGO_FACTOR_HABITUAL && cociente >= 1 / RANGO_FACTOR_HABITUAL) return undefined
  const veces = cociente >= 1 ? `${fmt(cociente)} veces mayor` : `${fmt(1 / cociente)} veces menor`
  const decimal = (cociente >= 8 && cociente <= 12.5) || (cociente >= 0.08 && cociente <= 0.125)
  return (
    `${etiqueta} (${fmt(valor)}) es ${veces} que lo habitual de este pozo (mediana ${fmt(m)}, entre ${fmt(Math.min(...base))} y ${fmt(Math.max(...base))} en las lecturas recientes)` +
    (decimal ? ': ¿se omitió o sobra un decimal?' : '. Verifica el dato.')
  )
}

export function evaluarRangos(e: EntradaRangos): AvisoRango[] {
  const avisos: AvisoRango[] = []
  const add = (campo: CampoRango, nivel: NivelRango, texto: string, tanqueId?: string) =>
    avisos.push({ campo, nivel, texto, ...(tanqueId && { tanqueId }) })

  const pf = num(e.pf), hw = num(e.hw), tGas = num(e.tGas), gg = num(e.gg), pCab = num(e.pCab), pSep = num(e.pSep)

  // --- tanques ---
  for (const t of e.tanques) {
    const mf = num(t.mf)
    if (!Number.isFinite(mf) || mf === 0) continue
    if (mf < 0) add('medidaFinal', 'ROJA', `Medida Final de ${t.nombre} (${fmt(mf)}) es negativa.`, t.id)
    else if (mf > MEDIDA_TANQUE_MAX) add('medidaFinal', 'AMARILLA', `Medida Final de ${t.nombre} (${fmt(mf)} pulg) es mayor que ${MEDIDA_TANQUE_MAX} pulg: ¿se omitió un decimal?`, t.id)
  }

  // --- gas (solo si el pozo tiene Placa y Meter Run: sin ellos el gas no se guarda) ---
  if (e.gasConfigurado) {
    if (Number.isFinite(pf) && pf < 0) add('pf', 'ROJA', `Presión Estática (${fmt(pf)} psig) es negativa.`)
    if (Number.isFinite(hw) && hw < 0) add('hw', 'ROJA', `Diferencial (${fmt(hw)} inH₂O) es negativo.`)
    if (pf > 0 && hw > 0 && hw / INH2O_POR_PSI > pf) {
      add('hw', 'ROJA', `Diferencial (${fmt(hw)} inH₂O ≈ ${fmt(hw / INH2O_POR_PSI)} psi) mayor que la presión estática (${fmt(pf)} psig): no es posible; revisa ambos datos.`)
    }
    if (pf > 0 && (e.limResorte ?? 0) > 0 && pf > (e.limResorte as number)) {
      add('pf', 'AMARILLA', `Presión Estática (${fmt(pf)} psig) excede el resorte configurado (${fmt(e.limResorte as number)} psi).`)
    }
    if (hw > 0 && (e.limGamma ?? 0) > 0 && hw > (e.limGamma as number)) {
      add('hw', 'AMARILLA', `Diferencial (${fmt(hw)} inH₂O) excede el gamma configurado (${fmt(e.limGamma as number)} inH₂O).`)
    }
    if (Number.isFinite(tGas) && (tGas < T_GAS_MIN || tGas > T_GAS_MAX)) {
      add('tGas', 'AMARILLA', `Temp. gas (${fmt(tGas)} °F) fuera de ${T_GAS_MIN} … ${T_GAS_MAX} °F.`)
    }
    if (Number.isFinite(gg) && gg !== 0 && (gg < GE_MIN || gg > GE_MAX)) {
      add('gg', 'AMARILLA', `Gravedad específica (${fmt(gg)}) fuera de ${GE_MIN} … ${GE_MAX}.`)
    }
    const hPf = fueraDeHabitual('Presión Estática', pf, e.historial?.pf)
    if (hPf) add('pf', 'AMARILLA', hPf)
    const hHw = fueraDeHabitual('Diferencial', hw, e.historial?.hw)
    if (hHw) add('hw', 'AMARILLA', hHw)
  }

  // --- presiones operativas ---
  if (Number.isFinite(pCab) && pCab < 0) add('pCab', 'ROJA', `P. Cabezal (${fmt(pCab)} psig) es negativa.`)
  if (Number.isFinite(pSep) && pSep < 0) add('pSep', 'ROJA', `P. Separador (${fmt(pSep)} psig) es negativa.`)
  if (pCab > 0 && pSep > 0 && pCab < pSep) {
    add('pCab', 'AMARILLA', `P. Cabezal (${fmt(pCab)}) es menor que P. Separador (${fmt(pSep)}): normalmente el cabezal tiene más presión. Verifica ambas.`)
  }
  const hCab = fueraDeHabitual('P. Cabezal', pCab, e.historial?.pCab)
  if (hCab) add('pCab', 'AMARILLA', hCab)
  const hSep = fueraDeHabitual('P. Separador', pSep, e.historial?.pSep)
  if (hSep) add('pSep', 'AMARILLA', hSep)

  return avisos
}

/** El peor nivel entre los avisos (ROJA > AMARILLA), o undefined si no hay ninguno. */
export function peorNivelRango(avisos: AvisoRango[]): NivelRango | undefined {
  if (avisos.some((a) => a.nivel === 'ROJA')) return 'ROJA'
  return avisos.length > 0 ? 'AMARILLA' : undefined
}
