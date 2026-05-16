// TODO: Constantes de seguridad - Player 1 (Backend)
// Paso 1: Definir roles y permisos
// Paso 2: Password requirements
// Paso 3: Session timeouts
// Entregable: Roles, permisos, requirements
export const ROLES = [
  'OPERADOR',
  'SUP_CAMPO',
  'SUP_MAYOR',
  'COORDINADOR',
  'GERENTE',
  'ADMIN'
] as const

export type Rol = typeof ROLES[number]

export const PERMISOS_ROL: Record<Rol, string[]> = {
  OPERADOR: ['crear:evaluacion', 'ver:propio', 'editar:propio'],
  SUP_CAMPO: ['crear:evaluacion', 'ver:todos', 'aprobar:evaluacion', 'rechazar:evaluacion'],
  SUP_MAYOR: ['crear:evaluacion', 'ver:todos', 'aprobar:evaluacion', 'rechazar:evaluacion', 'exportar:reportes'],
  COORDINADOR: ['crear:evaluacion', 'ver:todos', 'aprobar:evaluacion', 'rechazar:evaluacion', 'exportar:reportes', 'gestionar:usuarios'],
  GERENTE: ['crear:evaluacion', 'ver:todos', 'aprobar:evaluacion', 'rechazar:evaluacion', 'exportar:reportes', 'gestionar:usuarios', 'ver:admin'],
  ADMIN: ['*']
}

export const PASSWORD_REQUIREMENTS = {
  minLength: 6,
  maxLength: 128,
  requireUppercase: false,
  requireLowercase: false,
  requireNumber: false,
  requireSpecialChar: false
}

export const SESSION_TIMEOUTS = {
  mobile: 7 * 24 * 60 * 60 * 1000, // 7 días
  web: 24 * 60 * 60 * 1000 // 24 horas
}

export const RATE_LIMITS = {
  login: { max: 5, windowMs: 15 * 60 * 1000 }, // 5 intentos por 15 min
  api: { max: 100, windowMs: 60 * 1000 }, // 100 requests por minuto
  export: { max: 10, windowMs: 60 * 60 * 1000 } // 10 exports por hora
}

export const VALIDATION_RULES = {
  maxTanquesPorEvaluacion: 10,
  maxLecturaBPH: 1000,
  maxLecturaBPD: 24000,
  maxPresion: 5000,
  maxTemperatura: 200
}
