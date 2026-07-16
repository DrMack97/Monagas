"use strict";
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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.info = info;
exports.warn = warn;
exports.error = error;
exports.debug = debug;
exports.createLogger = createLogger;
// TODO: Logging centralizado - Player 1 (Backend)
// Paso 1: Crear logger con levels (info, warn, error)
// Paso 2: Incluir timestamp, function name, context
// Paso 3: Usar functions.logger
// Prompt de implementación rápida:
// "Crear logger(info), logger.warn(), logger.error() con metadata"
// Entregable:
// - logger.info(message, metadata)
// - logger.warn(message, metadata)
// - logger.error(message, metadata, error)
const functions = __importStar(require("firebase-functions"));
function info(message, metadata) {
    functions.logger.info(message, { ...metadata, level: 'info' });
}
function warn(message, metadata) {
    functions.logger.warn(message, { ...metadata, level: 'warn' });
}
function error(message, metadata, err) {
    functions.logger.error(message, {
        ...metadata,
        level: 'error',
        error: err?.message
    });
}
function debug(message, metadata) {
    if (process.env.NODE_ENV === 'development') {
        functions.logger.debug(message, { ...metadata, level: 'debug' });
    }
}
function createLogger(functionName) {
    return {
        info: (message, metadata) => info(message, { functionName, ...metadata }),
        warn: (message, metadata) => warn(message, { functionName, ...metadata }),
        error: (message, metadata, err) => error(message, { functionName, ...metadata }, err),
        debug: (message, metadata) => debug(message, { functionName, ...metadata })
    };
}
//# sourceMappingURL=logger.js.map