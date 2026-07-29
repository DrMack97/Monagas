"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// TODO: Tests de notifyMgr - Player 1 (Backend)
// Paso 1: Test trigger cuando evaluación cambia a PENDIENTE_SUPERVISOR
// Paso 2: Test envío FCM a gerente
// Paso 3: Test sin gerentes activos
// Prompt de implementación rápida:
// "Crear tests para notifyMgr con Firestore Emulator"
const globals_1 = require("@jest/globals");
(0, globals_1.describe)('notifyMgr', () => {
    (0, globals_1.it)('debe enviar notificación cuando evaluación se envía', async () => {
        // TODO: Implementar test con Firestore Emulator
        // 1. Crear evaluación con estado PENDIENTE_SUPERVISOR
        // 2. Trigger notifyMgr
        // 3. Verificar FCM send llamado
        // 4. Verificar notificación con title correcto
        (0, globals_1.expect)(true).toBe(true); // Placeholder
    });
    (0, globals_1.it)('no debe hacer nada si no hay gerentes activos', async () => {
        // TODO: Implementar test
        // 1. Crear evaluación PENDIENTE_SUPERVISOR
        // 2. Ningún gerente activo
        // 3. Verificar no se envía notificación
        (0, globals_1.expect)(true).toBe(true); // Placeholder
    });
});
//# sourceMappingURL=notifyMgr.test.js.map