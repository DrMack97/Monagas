// packages/core/src/constants/roles.ts

export const ROLES = {
  OPERADOR: 'OPERADOR',
  SUP_CAMPO: 'SUP_CAMPO',
  SUP_AREA: 'SUP_AREA',
  GERENTE: 'GERENTE',
  ROOT: 'ROOT',
} as const

export type RolKey = keyof typeof ROLES

export const ROL_LABEL: Record<string, string> = {
  OPERADOR: 'Operador de Campo',
  SUP_CAMPO: 'Supervisor de Campo',
  SUP_AREA: 'Supervisor de Área',
  GERENTE: 'Gerente',
}

export const ESTADOS_EVALUACION = {
  EN_CURSO: 'EN_CURSO',
  CERRADA: 'CERRADA',
  PENDIENTE_SUPERVISOR: 'PENDIENTE_SUPERVISOR',
  APROBADA_SUPERVISOR: 'APROBADA_SUPERVISOR',
  OFICIAL: 'OFICIAL',
} as const
