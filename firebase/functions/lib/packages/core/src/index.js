"use strict";
// packages/core/src/index.ts
// Barrel principal — re-exporta todos los submódulos de @core
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validarRango = exports.validarLectura = exports.getRangoNormal = void 0;
__exportStar(require("./calculos/index.js"), exports);
__exportStar(require("./types/index.js"), exports);
__exportStar(require("./constants/index.js"), exports);
var index_js_1 = require("./utils/index.js");
Object.defineProperty(exports, "getRangoNormal", { enumerable: true, get: function () { return index_js_1.getRangoNormal; } });
Object.defineProperty(exports, "validarLectura", { enumerable: true, get: function () { return index_js_1.validarLectura; } });
Object.defineProperty(exports, "validarRango", { enumerable: true, get: function () { return index_js_1.validarRango; } });
//# sourceMappingURL=index.js.map