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
  legal?: IPozoLegal  // Información legal — ver IPozoLegal. Opcional: pozos existentes no lo tienen todavía.
  horasEval: number
  estado: EstadoEvaluacion
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
}

export interface ILog {
  tipo: 'OVERRIDE_ALERTA' | 'SYNC_CONFLICT' | 'APROBACION' | 'ERROR'
  uid: string
  recurso: string
  detalle: Record<string, unknown>
  timestamp: Date
}