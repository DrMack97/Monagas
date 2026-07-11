// packages/core/src/types/database.ts
//
// Tipos alineados al TRD v3 — Well Testing MVP
// Norte de Monagas / Faja del Orinoco

export type Rol = 'OPERADOR' | 'SUP_CAMPO' | 'SUP_MAYOR' | 'GERENTE' | 'ROOT'
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
  pozosAsignados: string[]
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