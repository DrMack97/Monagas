// packages/core/src/types/database.ts
//
// Tipos alineados al TRD v3 — Well Testing MVP
// Norte de Monagas / Faja del Orinoco

export type Rol = 'OPERADOR' | 'SUP_CAMPO' | 'SUP_AREA' | 'GERENTE' | 'ROOT'
export type Zona = 'FAJA' | 'MONAGAS' | 'TODOS'

export type EstadoEvaluacion =
  | 'EN_CURSO'
  | 'CERRADA'
  | 'PENDIENTE_SUPERVISOR'
  | 'APROBADA_SUPERVISOR'
  | 'OFICIAL'

export interface ITank {
  id: string
  nombre: string
  mi: number   // Medida Inicial (pulg)
  ft: number   // Factor Tanque — kk individual por tanque (BBL/pulg)
}

/**
 * Información legal/regulatoria del pozo — deliberadamente separada
 * de las características técnicas (ITank, límites, meterRun, etc.).
 * No se mezclan porque tienen ciclos de vida y dueños distintos:
 * lo técnico lo edita SUP_CAMPO/SUP_AREA en operación diaria; lo
 * legal normalmente lo captura una sola vez el SUP_AREA/GERENTE al
 * dar de alta el pozo, y cambia con mucha menor frecuencia.
 */
export interface IPozoLegal {
  concesionario: string        // Titular legal de los derechos de explotación (puede diferir de la empresa contratista que ejecuta el servicio)
  numeroConcesion?: string
  fechaOtorgamiento?: Date
  fechaVencimiento?: Date
  rifOperador?: string         // RIF de la empresa operadora/concesionaria
  coordenadas?: {
    lat: number
    lng: number
  }
}

export interface IPozo {
  id: string
  nombre: string
  campo: string
  zona: Zona
  ft: string          // Factor default para nuevos tanques
  limResorte: number  // psi
  limGamma: number    // inH₂O
  meterRun?: number   // pulg — Meter Run D
  diamOrif?: number   // pulg — Diámetro Placa d
  empresa?: string    // Empresa contratista que ejecuta el servicio (encabezado de reporte)
  equipo?: string     // Identificador del equipo de medición (ej. "WT-DSI-01") — encabezado del reporte PDVSA, dato estable del pozo igual que `empresa`
  legal?: IPozoLegal  // Información legal — ver IPozoLegal. Opcional: pozos existentes no lo tienen todavía.
  horasEval: number
  estado: EstadoEvaluacion
  /**
   * Puntero a la evaluación EN_CURSO activa de este pozo, o null si
   * ninguna está abierta ahora mismo (recién creado, o justo después
   * de un cierre FINAL_24H). Es el candado que usa useEvaluacionActual.ts
   * (mobile-operator) para resolver el evalId de forma atómica vía
   * runTransaction — sin esto, dos pestañas/dispositivos del mismo
   * Operador viendo el pozo vacío a la vez podían crear dos
   * evaluaciones EN_CURSO duplicadas para el mismo pozo.
   * Ciclo de vida (mantenido por Cloud Functions con Admin SDK,
   * salvo la creación inicial que hace el propio Operador):
   *   - null → id: cuando el Operador abre el pozo sin ciclo activo
   *     (useEvaluacionActual.ts, transacción cliente).
   *   - id → null: cuando esa evaluación pasa a PENDIENTE_SUPERVISOR
   *     (onEvalSubmit.ts) — libera el candado para el próximo ciclo.
   *   - null → id (mismo id de antes): cuando el Supervisor rechaza y
   *     la evaluación vuelve a EN_CURSO (onReject.ts) — reabre el
   *     mismo documento en vez de dejar que se cree uno nuevo.
   */
  evalEnCursoId?: string | null
  asignados: string[] // UIDs de operadores
  creadoPor: string
  tanques: ITank[]
}

export interface IConfigEval {
  apiXp: number
  aysPct: number
  diam?: number
  gg?: number
  tGas?: number
  meterRun?: number
}

export interface IResultadosEval {
  bpdPromedio: number
  netosPromedio: number
  qgPromedio: number
  aysBls: number
  horasTotales: number
  proyeccion24H: number
  /**
   * FINAL_24H — horasEvaluadas >= horasEval del pozo, cierra la
   * evaluación (estado → CERRADA).
   * PRELIMINAR_FORZADO — calculado bajo demanda antes de completar
   * el ciclo (botón "Calcular Promedio" en ReportePage); no cierra
   * la evaluación, solo guarda un snapshot de resultados.
   */
  tipoCalculo: 'FINAL_24H' | 'PRELIMINAR_FORZADO'
  calculadoEn: Date
}

export interface IAprobacion {
  rol: Rol
  uid: string
  accion: 'APROBAR' | 'RECHAZAR'
  timestamp: Date
  comentario?: string
}

/**
 * Campos administrativos/de cierre del formato "REPORTE DE
 * OPERACIONES DE WELL TESTING" (Gerencia de Producción, División
 * Punta de Mata) que no tienen equivalente en el resto del esquema.
 * Se llenan UNA SOLA VEZ por evaluación, no por lectura horaria — el
 * Operador los captura al cerrar el ciclo en ReportePage.tsx, igual
 * que ya hace con `resultados`.
 *
 * BSW% NO está acá — es el mismo concepto que `aysPct` (Agua y
 * Sedimentos) que ya existe por tanque en cada lectura, solo con otro
 * nombre. No se duplica.
 */
export interface IReporteOperativo {
  supervisorPDVSA?: string
  cuadrillaDiurno?: string
  cuadrillaNocturno?: string
  fechaAlineacion?: Date // Cuándo se alineó el pozo al skid de well testing — distinta de fechaInicio (cuándo arrancó ESTE ciclo de medición)
  estadoActual?: string  // Texto libre, ej. "Pozo alineado a través del SWT DSI con retorno de fluidos a tanques y quema de gas en sitio"
  notas?: string
  tipoFluido?: {
    api: number   // Gravedad API (°)
    h2s?: string  // Presencia/medición de H2S — texto libre (ppm, "Negativo", etc.), no siempre se mide con un número
  }
  resumenTanques?: {
    existencia: number     // Existencia total en tanques (Bls) al momento del reporte
    trasegable: number     // Volumen trasegable (Bls)
    totalTrasegado: number // Total trasegado acumulado (Bls)
  }
  nivelCellar?: number  // %
  viajesVacuum?: number // Cantidad de viajes de camión vacuum
}

export interface IEvaluacion {
  id: string
  pozoId: string
  operadorId: string
  estado: EstadoEvaluacion
  fechaInicio: Date
  fechaCierre?: Date
  horasEvaluadas: number
  zona: Zona
  config: IConfigEval
  resultados?: IResultadosEval
  aprobaciones?: IAprobacion[]
  reporteOperativo?: IReporteOperativo
  creadoEn: Date
}

export interface ILecturaTanque {
  tanqueId: string
  mi: number
  mf: number
  dif: number
  th: number
  reductor: number
  bph: number
  bpd: number
  aysBls: number
  netos: number
}

export interface ILecturaGas {
  pf: number
  hw: number
  tGas: number
  gg: number
  diam: number
  meterRun: number
  beta: number
  Fc: number
  Fb: number
  Fg: number
  Ftf: number
  qg: number
}

export interface ILecturaOp {
  pCab: number
  pSep: number
  /**
   * Presión de casing — campo "P.Csg" del reporte PDVSA. Opcional
   * porque las lecturas ya guardadas antes de este campo no lo
   * tienen (no aplica retroactivamente, y no siempre se mide).
   */
  pCsg?: number
  /**
   * Tamaño del estrangulador/reductor en el cabezal — campo "Red."
   * del reporte PDVSA (ej. "1/2""). Es un STRING, no un número: se
   * expresa como fracción de pulgada, no como cantidad continua.
   *
   * OJO — no confundir con ILecturaTanque.reductor: ese es un valor
   * en Bls usado en calcTanque() para corregir el cálculo de volumen
   * por tanque, un concepto completamente distinto que solo comparte
   * el nombre en español. Este (reductorPulgadas) es puramente
   * descriptivo para el reporte, no participa en ningún cálculo.
   */
  reductorPulgadas?: string
}

export interface ILectura {
  id: string
  hora: number
  timestamp: Date
  tanques: ILecturaTanque[]
  gas?: ILecturaGas
  operativos: ILecturaOp
  alertas?: string[]
  syncLocal?: boolean
}

export interface IUsuario {
  uid: string
  nombre: string
  email: string
  rol: Rol
  zona: Zona
  /**
   * Un único pozo asignado — aplica a OPERADOR y SUP_CAMPO.
   * Solo pueden leer información de ESTE pozo hasta ser reasignados.
   * SUP_AREA y GERENTE no usan este campo: su acceso se rige por `zona`.
   * Reasignar este valor es exclusivo de SUP_AREA/GERENTE — ver
   * firebase/functions/src/auth/reassignPozo.ts
   */
  pozoAsignado: string | null
  activo: boolean
  creadoEn: Date
  ultimoAcceso?: Date
  /**
   * Token de FCM para notificaciones push — lo escribe el propio
   * usuario desde su dispositivo (ver firestore.rules: excepción
   * puntual a la escritura restringida a ROOT en /usuarios, solo
   * para este campo). notifyOperator.ts lo lee para notificar
   * aprobación/rechazo de evaluaciones.
   */
  fcmToken?: string
}

export interface ILog {
  tipo: 'OVERRIDE_ALERTA' | 'SYNC_CONFLICT' | 'APROBACION' | 'ERROR'
  uid: string
  recurso: string
  detalle: Record<string, unknown>
  timestamp: Date
}