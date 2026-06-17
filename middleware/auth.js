// ============================================
// middleware/auth.js - Verificación de JWT y roles
// ============================================

const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');

const JWT_SECRET = process.env.JWT_SECRET || 'cafe-pos-dev-secret';

// Verifica que la petición traiga un token válido
function verificarToken(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return next(new AppError('No autorizado. Inicia sesión para continuar.', 401));
  }

  try {
    req.usuario = jwt.verify(auth.slice(7), JWT_SECRET);
    next();
  } catch {
    next(new AppError('Sesión expirada. Vuelve a iniciar sesión.', 401));
  }
}

// Solo permite administradores (usar después de verificarToken)
function soloAdmin(req, res, next) {
  if (req.usuario?.rol !== 'admin') {
    return next(new AppError('Acceso restringido a administradores.', 403));
  }
  next();
}

module.exports = { verificarToken, soloAdmin };
