// TODO: Export barrel de tipos - Player 1 (Backend)
// Paso 1: Exportar database.ts, ui.ts, api.ts
// Paso 2: Definir IWell, IEvaluation, ILecture, ITank, IUser, IApproval
// Entregable: tipos compartidos disponibles para apps y functions
// packages/core/src/types.ts
import { User as CoreUser } from '@monagas/core';
export interface User extends CoreUser {
  uid: string;
  email: string;
  nombre?: string;
  rol?: string;
  totalEvaluaciones?: number;
  pozosActivos?: number;
  streakDays?: number;
  // ... otras propiedades
}
export interface IEvaluation { /* ... */ }
export interface IWell { /* ... */ }
export interface User { /* ... */ }