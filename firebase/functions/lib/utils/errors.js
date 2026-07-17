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
exports.InternalError = exports.NotFoundError = exports.AuthorizationError = exports.AuthenticationError = exports.ValidationError = exports.AppError = void 0;
exports.toHttpsError = toHttpsError;
// TODO: Custom error classes - Player 1 (Backend)
// Paso 1: Crear AppError con code, message, statusCode
// Paso 2: Crear ValidationError, AuthenticationError, NotFoundError
// Paso 3: Helper para convertir a functions.https.HttpsError
// Prompt de implementación rápida:
// "Crear AppError, ValidationError, NotFoundError, toHttpsError"
// Entregable:
// - new AppError('CODE', 'message')
// - new ValidationError('message')
// - new NotFoundError('resource')
// - toHttpsError(error) → functions.https.HttpsError
class AppError extends Error {
    constructor(code, message, statusCode = 400) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.name = 'AppError';
    }
}
exports.AppError = AppError;
class ValidationError extends AppError {
    constructor(message) {
        super('validation-error', message, 400);
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
class AuthenticationError extends AppError {
    constructor(message = 'Unauthorized') {
        super('authentication-error', message, 401);
        this.name = 'AuthenticationError';
    }
}
exports.AuthenticationError = AuthenticationError;
class AuthorizationError extends AppError {
    constructor(message = 'Forbidden') {
        super('authorization-error', message, 403);
        this.name = 'AuthorizationError';
    }
}
exports.AuthorizationError = AuthorizationError;
class NotFoundError extends AppError {
    constructor(resource) {
        super('not-found', `${resource} not found`, 404);
        this.name = 'NotFoundError';
    }
}
exports.NotFoundError = NotFoundError;
class InternalError extends AppError {
    constructor(message = 'Internal error') {
        super('internal-error', message, 500);
        this.name = 'InternalError';
    }
}
exports.InternalError = InternalError;
const functions = __importStar(require("firebase-functions"));
function toHttpsError(error) {
    if (error instanceof functions.https.HttpsError) {
        return error;
    }
    if (error instanceof AppError) {
        const codeMap = {
            'validation-error': 'invalid-argument',
            'authentication-error': 'unauthenticated',
            'authorization-error': 'permission-denied',
            'not-found': 'not-found',
            'internal-error': 'internal'
        };
        return new functions.https.HttpsError(codeMap[error.code] || 'internal', error.message);
    }
    return new functions.https.HttpsError('internal', error.message);
}
//# sourceMappingURL=errors.js.map