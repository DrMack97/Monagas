// packages/core/src/constants/security.ts
//
// Matriz de permisos de referencia. La fuente de verdad real para
// autorización son las Firestore Rules (firebase/firestore.rules) y
// la Cloud Function reassignPozo — esto documenta esa misma lógica
// en un formato consultable desde el código cliente (ej: para
// mostrar/ocultar botones en la UI según el rol).
//
// Matriz de visibilidad de pozos (confirmada):
//   OPERADOR / SUP_CAMPO → lectura de UN (1) pozo asignado (pozoAsignado)
//   SUP_AREA             → crea y gestiona todos los pozos de su zona
//   GERENTE               → visualización global, todos los pozos del sistema

import type { Rol } from '../types/database.js'

export const PERMISOS_ROL: Record<Rol, string[]> = {
  OPERADOR: ['ver:pozo_propio', 'crear:evaluacion', 'editar:evaluacion_propia'],
  SUP_CAMPO: ['ver:pozo_propio', 'aprobar:evaluacion', 'rechazar:evaluacion'],
  SUP_AREA: [
    'ver:pozos_supervision',
    'crear:pozo',
    'gestionar:pozo',
    'reasignar:personal',
    'aprobar:evaluacion',
    'rechazar:evaluacion',
    'exportar:reportes',
  ],
  GERENTE: ['ver:todos_pozos', 'aprobar:evaluacion', 'exportar:reportes'],
  ROOT: ['*'],
}

export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: false,
  requireLowercase: false,
  requireNumber: false,
  requireSpecialChar: false,
}

export const SESSION_TIMEOUTS = {
  mobile: 7 * 24 * 60 * 60 * 1000, // 7 días
  web: 24 * 60 * 60 * 1000, // 24 horas
}

export const RATE_LIMITS = {
  login: { max: 5, windowMs: 15 * 60 * 1000 }, // 5 intentos por 15 min
  api: { max: 100, windowMs: 60 * 1000 }, // 100 requests por minuto
  export: { max: 10, windowMs: 60 * 60 * 1000 }, // 10 exports por hora
}

export const VALIDATION_RULES = {
  maxTanquesPorEvaluacion: 5,
  maxLecturaBPH: 1000,
  maxLecturaBPD: 24000,
  maxPresion: 5000,
  maxTemperatura: 200,
}
