// src/config/enlaces.ts
//
// URL de la app del Operador en versión web del MISMO ambiente. Solo existe en staging (en producción
// el Operador usa el APK): sin la variable de entorno, el enlace no se muestra. Se aísla en su propio
// módulo porque import.meta.env no lo entiende Jest (ver jest.config.cjs: se sustituye por
// src/test/__mocks__/enlaces.ts, igual que services/firebase).
export const URL_OPERADOR: string = import.meta.env.VITE_URL_OPERADOR || ''
