// ============================================
// utils/AppError.js - Error de negocio tipado
// ============================================
// Separa errores esperados (400/404) de errores inesperados (500).
// El error handler en server.js usa `isOperational` para decidir
// cuánto detalle enviar al cliente.

class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // error de negocio, no un bug
  }
}

module.exports = AppError;
