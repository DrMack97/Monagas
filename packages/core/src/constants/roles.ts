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
export const ROLES = [
  'OPERADOR',
  'SUP_CAMPO',
  'SUP_MAYOR',
  'COORDINADOR',
  'GERENTE'
] as const

export type Rol = typeof ROLES[number]

export const PERMISOS_ROL: Record<Rol, {
  crearEvaluacion: boolean
  aprobar: boolean
  rechazar: boolean
  verReportes: boolean
  exportar: boolean
  gestionarUsuarios: boolean
}> = {
  OPERADOR: {
    crearEvaluacion: true,
    aprobar: false,
    rechazar: false,
    verReportes: false,
    exportar: false,
    gestionarUsuarios: false
  },
  SUP_CAMPO: {
    crearEvaluacion: true,
    aprobar: true,
    rechazar: true,
    verReportes: true,
    exportar: false,
    gestionarUsuarios: false
  },
  SUP_MAYOR: {
    crearEvaluacion: true,
    aprobar: true,
    rechazar: true,
    verReportes: true,
    exportar: true,
    gestionarUsuarios: false
  },
  COORDINADOR: {
    crearEvaluacion: true,
    aprobar: true,
    rechazar: true,
    verReportes: true,
    exportar: true,
    gestionarUsuarios: true
  },
  GERENTE: {
    crearEvaluacion: true,
    aprobar: true,
    rechazar: true,
    verReportes: true,
    exportar: true,
    gestionarUsuarios: true
  }
}

export const JERARQUIA_ROL: Record<Rol, number> = {
  OPERADOR: 1,
  SUP_CAMPO: 2,
  SUP_MAYOR: 3,
  COORDINADOR: 4,
  GERENTE: 5
}

export const ROLES_PUEDEN_APROBAR: Rol[] = ['SUP_CAMPO', 'SUP_MAYOR', 'COORDINADOR', 'GERENTE']
export const ROLES_PUEDEN_RECHAZAR: Rol[] = ['SUP_CAMPO', 'SUP_MAYOR', 'COORDINADOR', 'GERENTE']
