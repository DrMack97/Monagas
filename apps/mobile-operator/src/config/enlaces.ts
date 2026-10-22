// src/config/enlaces.ts
//
// URL del panel de supervisión del MISMO ambiente (staging o producción). Va por variable de entorno
// porque cambia con el ambiente; si no está definida, el enlace simplemente no se muestra. Se aísla en
// su propio módulo porque import.meta.env no lo entiende Jest (ver jest.config.cjs: se sustituye por
// src/test/__mocks__/enlaces.ts, igual que services/firebase).
export const URL_PANEL: string = import.meta.env.VITE_URL_PANEL || ''
