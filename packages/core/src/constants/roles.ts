// TODO: Definición de roles del sistema - Player 4 (Product Manager)
// Paso 1: Definir OPERADOR, SUP_CAMPO, SUP_MAYOR, COORDINADOR, GERENTE
// Paso 2: Definir permisos por rol
// Paso 3: Definir jerarquía de aprobaciones
// Prompt de implementación rápida:
// "Crear constantes ROLES, PERMISOS_ROL, JERARQUIA_ROL"
// Entregable:
// - ROLES: array de roles
// - PERMISOS_ROL[rol]: { crearEvaluacion, aprobar, rechazar, verReportes }
// - JERARQUIA_ROL[rol]: nivel (1-5)
// packages/core/src/constants/roles.ts

export const ROLES = {
  OPERADOR: 'OPERADOR',
  SUP_CAMPO: 'SUP_CAMPO',
  SUP_MAYOR: 'SUP_MAYOR',
  GERENTE: 'GERENTE',
  ROOT: 'ROOT',
} as const

export type RolKey = keyof typeof ROLES

export const ROL_LABEL: Record<string, string> = {
  OPERADOR: 'Operador de Campo',
  SUP_CAMPO: 'Supervisor de Campo',
  SUP_MAYOR: 'Supervisor Mayor',
  GERENTE: 'Gerente',
}

export const ESTADOS_EVALUACION = {
  EN_CURSO: 'EN_CURSO',
  CERRADA: 'CERRADA',
  PENDIENTE_SUPERVISOR: 'PENDIENTE_SUPERVISOR',
  APROBADA_SUPERVISOR: 'APROBADA_SUPERVISOR',
  OFICIAL: 'OFICIAL',
} as const