"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RANGOS_NORMALES = void 0;
exports.getRangoNormal = getRangoNormal;
exports.validarRango = validarRango;
exports.validarLectura = validarLectura;
exports.RANGOS_NORMALES = {
    bph: { min: 0, max: 1000, normalMin: 10, normalMax: 500 },
    bpd: { min: 0, max: 24000, normalMin: 240, normalMax: 12000 },
    qg: { min: 0, max: 100, normalMin: 0.001, normalMax: 50 },
    presion: { min: 0, max: 5000, normalMin: 100, normalMax: 3000 },
    temperatura: { min: -50, max: 200, normalMin: 10, normalMax: 80 }
};
function getRangoNormal(type) {
    return exports.RANGOS_NORMALES[type] || { min: 0, max: Infinity };
}
function validarRango(type, value) {
    const rango = getRangoNormal(type);
    // Validar fuera de rango absoluto
    if (value < rango.min || value > rango.max) {
        return {
            valid: false,
            warning: `${type} fuera de rango absoluto (${rango.min} - ${rango.max})`,
            outOfRange: true
        };
    }
    // Validar fuera de rango normal (warning)
    if (rango.normalMin && value < rango.normalMin) {
        return {
            valid: true,
            warning: `${type} por debajo del rango normal (${rango.normalMin} - ${rango.normalMax})`,
            outOfRange: false
        };
    }
    if (rango.normalMax && value > rango.normalMax) {
        return {
            valid: true,
            warning: `${type} por encima del rango normal (${rango.normalMin} - ${rango.normalMax})`,
            outOfRange: false
        };
    }
    return { valid: true };
}
function validarLectura(lectura) {
    const warnings = [];
    const errors = [];
    const fields = ['bph', 'bpd', 'qg', 'presion', 'temperatura'];
    for (const field of fields) {
        if (lectura[field] !== undefined) {
            const resultado = validarRango(field, lectura[field]);
            if (resultado.outOfRange) {
                errors.push(resultado.warning);
            }
            else if (resultado.warning) {
                warnings.push(resultado.warning);
            }
        }
    }
    return {
        valid: errors.length === 0,
        warnings,
        errors
    };
}
//# sourceMappingURL=validators.js.map