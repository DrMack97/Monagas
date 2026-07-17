"use strict";
// packages/core/src/calculos/tanque.ts
//
// Motor de cálculo de volumen de tanque.
Object.defineProperty(exports, "__esModule", { value: true });
exports.calcTanque = calcTanque;
function calcTanque(input) {
    const { mi, mf, ft, th, reductor, aysPct } = input;
    if (th <= 0) {
        throw new Error('Tiempo debe ser > 0');
    }
    if (aysPct < 0 || aysPct > 100) {
        throw new Error('AyS% debe estar entre 0 y 100');
    }
    const dif = Math.max(0, mf - mi);
    const bph = Math.max(0, (dif * ft - reductor) / th);
    const bpd = bph * 24;
    const aysBls = bpd * (aysPct / 100);
    const netos = Math.max(0, bpd - aysBls);
    return { dif, bph, bpd, aysBls, netos };
}
//# sourceMappingURL=tanque.js.map