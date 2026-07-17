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
exports.handleError = handleError;
exports.withErrorHandling = withErrorHandling;
// TODO: Error handler para Cloud Functions - Player 1 (Backend)
// Paso 1:clasificar errores
// Paso 2: Log to Sentry
// Paso 3: Convertir a functions.https.HttpsError
// Prompt de implementación rápida:
// "Crear handleError para Cloud Functions con Sentry"
const functions = __importStar(require("firebase-functions"));
const Sentry = __importStar(require("@sentry/node"));
// Init Sentry para Cloud Functions
const SENTRY_DSN = process.env.SENTRY_DSN;
if (SENTRY_DSN) {
    Sentry.init({
        dsn: SENTRY_DSN,
        environment: process.env.NODE_ENV || 'production',
        tracesSampleRate: 0.1
    });
}
class AppError extends Error {
    constructor(code, message, statusCode = 400, details) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
        this.name = 'AppError';
    }
}
exports.AppError = AppError;
class ValidationError extends AppError {
    constructor(message, fields) {
        super('validation-error', message, 400);
        this.fields = fields;
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
function handleError(error, context) {
    console.error('Error en Cloud Function:', error);
    // Sentry capture
    if (SENTRY_DSN && error instanceof Error) {
        Sentry.captureException(error, {
            extra: context
        });
    }
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
        return new functions.https.HttpsError(codeMap[error.code] || 'internal', error.message, error.details);
    }
    // Unknown error
    return new functions.https.HttpsError('internal', error instanceof Error ? error.message : 'Unknown error');
}
// Decorator para自动 error handling
function withErrorHandling(fn) {
    try {
        return fn();
    }
    catch (error) {
        throw handleError(error);
    }
}
//# sourceMappingURL=error-handler.js.map