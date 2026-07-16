"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validarEvaluacion = validarEvaluacion;
exports.validarRol = validarRol;
exports.validarPozoId = validarPozoId;
exports.validarEmail = validarEmail;
exports.requireField = requireField;
// TODO: Validaciones server-side - Player 1 (Backend)
// Paso 1: validarEvaluacion(lecturas, tanques)
// Paso 2: validarRol(rol)
// Paso 3: validarPozoId(pozoId)
// Prompt de implementación rápida:
// "Crear validarEvaluacion, validarRol, validarPozoId con errores claros"
// Entregable:
// - validarEvaluacion({bph, bpd, presion, temperatura}) → { valid, errors }
// - validarRol('OPERADOR') → true
// - validarPozoId('MFB-950') → true
const errors_1 = require("./errors");
function validarEvaluacion(lecturas) {
    const errors = [];
    if (lecturas.bph === undefined || lecturas.bph === null) {
        errors.push('BPH es requerido');
    }
    else if (lecturas.bph < 0 || lecturas.bph > 1000) {
        errors.push('BPH debe estar entre 0 y 1000');
    }
    if (lecturas.bpd === undefined || lecturas.bpd === null) {
        errors.push('BPD es requerido');
    }
    else if (lecturas.bpd < 0 || lecturas.bpd > 24000) {
        errors.push('BPD debe estar entre 0 y 24000');
    }
    if (lecturas.presion === undefined || lecturas.presion === null) {
        errors.push('Presión es requerida');
    }
    else if (lecturas.presion < 0 || lecturas.presion > 5000) {
        errors.push('Presión debe estar entre 0 y 5000');
    }
    if (lecturas.temperatura === undefined || lecturas.temperatura === null) {
        errors.push('Temperatura es requerida');
    }
    else if (lecturas.temperatura < -50 || lecturas.temperatura > 200) {
        errors.push('Temperatura debe estar entre -50 y 200');
    }
    return {
        valid: errors.length === 0,
        errors
    };
}
function validarRol(rol) {
    const validRoles = ['OPERADOR', 'SUP_CAMPO', 'SUP_MAYOR', 'COORDINADOR', 'GERENTE'];
    return validRoles.includes(rol);
}
function validarPozoId(pozoId) {
    if (!pozoId || typeof pozoId !== 'string') {
        return false;
    }
    // Validar formato (alphanumeric, dash, underscore)
    return /^[a-zA-Z0-9_-]+$/.test(pozoId);
}
function validarEmail(email) {
    if (!email || typeof email !== 'string') {
        return false;
    }
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function requireField(value, fieldName) {
    if (value === undefined || value === null) {
        throw new errors_1.ValidationError(`${fieldName} es requerido`);
    }
    return value;
}
//# sourceMappingURL=validators.js.map