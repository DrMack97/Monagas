"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fmt = fmt;
exports.san = san;
exports.dateFormat = dateFormat;
exports.dateTimeFormat = dateTimeFormat;
exports.formatProduction = formatProduction;
exports.formatPercentage = formatPercentage;
exports.sanitizeInput = sanitizeInput;
exports.formatCurrency = formatCurrency;
exports.formatDuration = formatDuration;
exports.formatRelativeTime = formatRelativeTime;
// TODO: Actualizar formatters con nuevos formatters Fase 2 - Player 3 (Fullstack)
// Entregable: Formatters actualizados
function fmt(num, decimals = 2) {
    return num.toFixed(decimals);
}
function san(num) {
    return num.toString().replace(/[^0-9.-]/g, '');
}
function dateFormat(date) {
    const d = new Date(date);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
}
function dateTimeFormat(date) {
    const d = new Date(date);
    return `${dateFormat(d)} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}
function formatProduction(production) {
    if (production >= 1000) {
        return `${(production / 1000).toFixed(2)} kBls/día`;
    }
    return `${production.toFixed(2)} Bls/día`;
}
function formatPercentage(value) {
    return `${value.toFixed(1)}%`;
}
function sanitizeInput(input) {
    return input.trim().replace(/[<>\"'&]/g, '');
}
// Fase 2: Formatters adicionales
function formatCurrency(value) {
    return new Intl.NumberFormat('es-VE', {
        style: 'currency',
        currency: 'USD'
    }).format(value);
}
function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
}
function formatRelativeTime(date) {
    const now = new Date();
    const then = new Date(date);
    const diff = Math.floor((now.getTime() - then.getTime()) / 1000);
    if (diff < 60)
        return 'ahora mismo';
    if (diff < 3600)
        return `${Math.floor(diff / 60)} min hace`;
    if (diff < 86400)
        return `${Math.floor(diff / 3600)} h hace`;
    if (diff < 604800)
        return `${Math.floor(diff / 86400)} d hace`;
    return dateFormat(date);
}
//# sourceMappingURL=formatters.js.map