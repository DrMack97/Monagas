"use strict";
// packages/core/src/utils/validators.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRangoNormal = getRangoNormal;
exports.validarRango = validarRango;
exports.validarLectura = validarLectura;
const RANGOS = {
    bph: { min: 0, max: 1000, normalMin: 10, normalMax: 500 },
    presion: { min: 0, max: 5000, normalMin: 50, normalMax: 3000 },
    temperatura: { min: 0, max: 300, normalMin: 40, normalMax: 200 },
    qg: { min: 0, max: 10000, normalMin: 0.01, normalMax: 1000 },
};
function getRangoNormal(tipo) {
    return RANGOS[tipo] ?? { min: 0, max: Infinity };
}
function validarRango(tipo, valor) {
    const rango = RANGOS[tipo];
    if (!rango)
        return { valid: true, outOfRange: false };
    if (valor < rango.min || valor > rango.max)
        return { valid: false, outOfRange: true };
    const fueraDeNormal = valor < (rango.normalMin ?? rango.min) ||
        valor > (rango.normalMax ?? rango.max);
    return {
        valid: true,
        outOfRange: false,
        ...(fueraDeNormal && { warning: `${tipo} fuera del rango normal` })
    };
}
function validarLectura(lectura) {
    const errors = [];
    const warnings = [];
    for (const [campo, valor] of Object.entries(lectura)) {
        if (valor === undefined)
            continue;
        const result = validarRango(campo, valor);
        if (!result.valid)
            errors.push(`${campo}: valor fuera de rango`);
        if (result.warning)
            warnings.push(result.warning);
    }
    return { valid: errors.length === 0, errors, warnings };
}
//# sourceMappingURL=validators.js.map