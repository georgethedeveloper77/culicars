"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
function errorHandler(err, _req, res, _next) {
    const statusCode = err.statusCode ?? 500;
    const message = statusCode === 500 ? 'Internal server error' : err.message;
    // Log full error in dev, minimal in prod
    if (process.env.NODE_ENV === 'development') {
        console.error('🔥 Error:', err);
    }
    else {
        console.error(`[${statusCode}] ${err.message}`);
    }
    res.status(statusCode).json({
        error: err.code ?? 'INTERNAL_ERROR',
        message,
        statusCode,
    });
}
