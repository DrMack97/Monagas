// packages/core/src/utils/balanceMasas.ts
//
// Alerta de balance de masas — mecanismo PREVENTIVO y NO BLOQUEANTE para detectar a tiempo errores humanos de
// captura (por ejemplo, omitir un decimal en una medida). Pedido del cliente, 2026-11-15:
//
//     Desplazamiento total − Total trasegado − Existente total = 0
//
// Cada tanque se balancea por separado (así un error en un tanque no se compensa con otro) y el resultado global es
// el peor de los tanques. Qué significa cada término con los datos que la app captura:
//
//   Desplazamiento total = volumen que ya había en el tanque al empezar el ciclo (medida inicial × factor del tanque)
//                          + la producción QUE LA APP REGISTRÓ en cada lectura (barriles/hora × horas, tal como se
//                          guardó y es lo que alimenta Bpd, Netos y el promedio que se aprueba).
//   Total trasegado      = suma de los barriles que los viajes de vacuum retiraron del tanque (campo "Trasegado").
//   Existente total      = lo que el tanque contiene AHORA según su última medida (medida final × factor del tanque).
//
// Si las medidas y los trasegados están bien capturados, el balance cuadra. NO es una igualdad trivial: la producción
// registrada se calcula con una regla (el cambio de nivel no baja de 0) y puede haberse editado, de modo que el
// balance descubre lo que esa regla oculta, p. ej. un tanque cuyo nivel baja sin trasegado declarado.
//
// Niveles (el residuo es Desplazamiento − Trasegado − Existente, en barriles):
//   OK        |residuo| ≤ 0.5 Bls          redondeo de decimales; no se avisa.
//   AMARILLA  0.5 < |residuo| ≤ 1 pulgada   desviación menor: menos de una pulgada de nivel de ESE tanque.
//   ROJA      |residuo| > 1 pulgada          discrepancia crítica: más de una pulgada de nivel de ese tanque.
// Una pulgada de nivel equivale a "factor del tanque" barriles (kk, Bls/pulg), por eso el umbral rojo se adapta a cada
// tanque. Omitir o añadir un decimal en una medida mueve el balance muchas pulgadas, así que cae en rojo.
//
// Además hay dos comprobaciones amarillas de incongruencia de datos (no son la ecuación de balance):
//   - Salto desproporcionado: la producción por hora de una lectura es ≥ 5 veces mayor o menor que la mediana de las
//     lecturas anteriores (con un salto de ≈10× se avisa de "posible decimal omitido o sobrante"). Esto atrapa el
//     decimal omitido que sube el nivel, que el balance no ve porque desplazamiento y existente suben igual.
//   - Cierre del reporte: existencia digitada ≠ medida por nivel, y Total trasegado acumulado digitado menor que lo
//     trasegado en este ciclo (imposible).
//
// Sin imports relativos a propósito: así se puede importar suelto (@core/utils/balanceMasas) desde Jest.

export type NivelAlerta = 'OK' | 'AMARILLA' | 'ROJA'

/** Por debajo de esto el residuo es redondeo de decimales y no se avisa. */
export const TOLERANCIA_BLS = 0.5
/** Barriles por pulgada si no se conoce el factor del tanque. */
export const BLS_POR_PULGADA_DEFECTO = 5
/** Salto de producción por hora (veces la mediana anterior) a partir del cual se avisa. */
export const FACTOR_SALTO = 5
/** Lecturas anteriores con producción mínimas para poder comparar un salto. */
export const LECTURAS_PARA_COMPARAR = 2

export interface TanqueBalanceInput {
  id: string
  nombre: string
  /** Factor del tanque kk (Bls por pulgada). */
  ft: number
  /** Medida inicial configurada del tanque (pulg): punto de partida si todavía no hay lecturas. */
  mi: number
}

export interface LecturaTanqueBalance {
  tanqueId: string
  mi: number
  mf: number
  /** Producción por hora tal como se guardó (Bls/h). */
  bph: number
  /** Horas del intervalo. */
  th: number
  trasegado?: number
}

export interface LecturaBalance {
  tanques: LecturaTanqueBalance[]
}

export interface BalanceTanque {
  tanqueId: string
  nombre: string
  desplazamiento: number
  trasegado: number
  existente: number
  /** Desplazamiento − Trasegado − Existente (Bls). Positivo: "sobra" desplazamiento. */
  residuo: number
  /** Barriles que equivalen a una pulgada de nivel de este tanque. */
  umbralRojo: number
  nivel: NivelAlerta
}

export interface BalanceMasas {
  tanques: BalanceTanque[]
  desplazamientoTotal: number
  totalTrasegado: number
  existenteTotal: number
  residuoTotal: number
  /** El peor nivel entre los tanques. */
  nivel: NivelAlerta
}

const ORDEN: Record<NivelAlerta, number> = { OK: 0, AMARILLA: 1, ROJA: 2 }

export function peorNivel(...niveles: NivelAlerta[]): NivelAlerta {
  return niveles.reduce<NivelAlerta>((peor, n) => (ORDEN[n] > ORDEN[peor] ? n : peor), 'OK')
}

/** Clasifica un residuo (Bls). El umbral rojo es el volumen de una pulgada de nivel del tanque. */
export function nivelDeResiduo(residuo: number, umbralRojo: number = BLS_POR_PULGADA_DEFECTO): NivelAlerta {
  const r = Math.abs(residuo)
  if (!Number.isFinite(r)) return 'ROJA'
  if (r <= TOLERANCIA_BLS) return 'OK'
  // Si una pulgada del tanque es menor que la tolerancia (factor muy chico), la tolerancia manda.
  const rojo = Math.max(umbralRojo, TOLERANCIA_BLS)
  return r <= rojo ? 'AMARILLA' : 'ROJA'
}

function positivo(n: unknown): number {
  return typeof n === 'number' && Number.isFinite(n) && n > 0 ? n : 0
}

export function balanceMasas(tanques: TanqueBalanceInput[], lecturas: LecturaBalance[]): BalanceMasas {
  const porTanque: BalanceTanque[] = tanques.map((tanque) => {
    const entradas = lecturas
      .map((l) => l.tanques.find((t) => t.tanqueId === tanque.id))
      // Una lectura vieja o incompleta (sin medida inicial/final) no puede entrar al balance: se ignora en vez de
      // dar una alerta falsa.
      .filter((t): t is LecturaTanqueBalance => !!t && Number.isFinite(t.mi) && Number.isFinite(t.mf))

    const miInicial = entradas.length > 0 ? entradas[0].mi : tanque.mi
    const mfActual = entradas.length > 0 ? entradas[entradas.length - 1].mf : tanque.mi
    const produccion = entradas.reduce((acc, e) => acc + (Number.isFinite(e.bph) && Number.isFinite(e.th) ? e.bph * e.th : 0), 0)
    const trasegado = entradas.reduce((acc, e) => acc + positivo(e.trasegado), 0)

    const desplazamiento = miInicial * tanque.ft + produccion
    const existente = mfActual * tanque.ft
    const residuo = desplazamiento - trasegado - existente
    const umbralRojo = tanque.ft > 0 ? tanque.ft : BLS_POR_PULGADA_DEFECTO

    return { tanqueId: tanque.id, nombre: tanque.nombre, desplazamiento, trasegado, existente, residuo, umbralRojo, nivel: nivelDeResiduo(residuo, umbralRojo) }
  })

  const suma = (f: (t: BalanceTanque) => number) => porTanque.reduce((acc, t) => acc + f(t), 0)
  return {
    tanques: porTanque,
    desplazamientoTotal: suma((t) => t.desplazamiento),
    totalTrasegado: suma((t) => t.trasegado),
    existenteTotal: suma((t) => t.existente),
    residuoTotal: suma((t) => t.residuo),
    nivel: peorNivel(...porTanque.map((t) => t.nivel)),
  }
}

// ---------------------------------------------------------------------------------------------------------------
// Incongruencia de datos: salto desproporcionado de la producción por hora (posible decimal omitido o sobrante)
// ---------------------------------------------------------------------------------------------------------------

export interface SaltoProduccion {
  /** Hay un salto desproporcionado respecto a las lecturas anteriores. */
  salto: boolean
  /** Veces que la nueva producción por hora es mayor (>1) o menor (<1) que la mediana anterior. */
  factor: number
  /** El factor es casi 10, 100, 1/10 o 1/100: típico de un decimal omitido o sobrante. */
  posibleDecimal: boolean
}

function mediana(valores: number[]): number {
  const orden = [...valores].sort((a, b) => a - b)
  const mitad = Math.floor(orden.length / 2)
  return orden.length % 2 ? orden[mitad] : (orden[mitad - 1] + orden[mitad]) / 2
}

function cercaDe(factor: number, objetivo: number): boolean {
  return factor >= objetivo * 0.8 && factor <= objetivo * 1.25
}

/**
 * Compara la producción por hora de la lectura nueva con la mediana de las anteriores del ciclo.
 * Solo avisa si hay al menos LECTURAS_PARA_COMPARAR lecturas previas con producción y la nueva produce algo
 * (una producción de 0 con nivel que baja ya lo cubre el balance de masas).
 */
export function detectarSalto(bphAnteriores: number[], bphNuevo: number): SaltoProduccion {
  const previas = bphAnteriores.filter((b) => Number.isFinite(b) && b > 0)
  if (previas.length < LECTURAS_PARA_COMPARAR || !(bphNuevo > 0)) return { salto: false, factor: 1, posibleDecimal: false }
  const referencia = mediana(previas)
  const factor = bphNuevo / referencia
  const salto = factor >= FACTOR_SALTO || factor <= 1 / FACTOR_SALTO
  const posibleDecimal = salto && [10, 100, 0.1, 0.01].some((x) => cercaDe(factor, x))
  return { salto, factor, posibleDecimal }
}

// ---------------------------------------------------------------------------------------------------------------
// Cierre del reporte: campos digitados por el Operador contra lo que se midió
// ---------------------------------------------------------------------------------------------------------------

export interface ValidacionCampo {
  nivel: NivelAlerta
  /** digitado − esperado (Bls). */
  diferencia: number
  posibleDecimal: boolean
}

/** Existencia digitada contra la medida por nivel (Σ medida final × factor). */
export function validarExistencia(digitada: number, medida: number, umbralRojo: number = BLS_POR_PULGADA_DEFECTO): ValidacionCampo {
  const diferencia = digitada - medida
  const factor = medida > 0 && digitada > 0 ? digitada / medida : 1
  const posibleDecimal = [10, 100, 0.1, 0.01].some((x) => cercaDe(factor, x))
  return { nivel: nivelDeResiduo(diferencia, umbralRojo), diferencia, posibleDecimal }
}

/**
 * El Total trasegado ACUMULADO incluye lo anterior a este ciclo, así que nunca puede ser MENOR que lo trasegado en
 * este ciclo: si lo es, hay un error de captura (crítico).
 */
export function validarTrasegadoAcumulado(digitado: number, trasegadoCiclo: number): ValidacionCampo {
  const diferencia = digitado - trasegadoCiclo
  const imposible = diferencia < -TOLERANCIA_BLS
  const factor = trasegadoCiclo > 0 && digitado > 0 ? digitado / trasegadoCiclo : 1
  return { nivel: imposible ? 'ROJA' : 'OK', diferencia, posibleDecimal: imposible && [0.1, 0.01].some((x) => cercaDe(factor, x)) }
}
