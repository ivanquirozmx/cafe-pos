// ============================================
// utils/asyncHandler.js - Wrapper para rutas sin try/catch repetido
// ============================================
// Soporta handlers síncronos y async/await.
// Cualquier error (thrown o rejected) se pasa automáticamente a next(err).

module.exports = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
