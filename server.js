// ============================================
// server.js - Servidor principal del Café POS
// ============================================
require('dotenv').config();

const express = require('express');
const helmet  = require('helmet');
const morgan  = require('morgan');
const cors    = require('cors');
const rateLimit = require('express-rate-limit');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;
const ENV  = process.env.NODE_ENV || 'development';

// ==================
// Seguridad y logging
// ==================
app.use(helmet());               // Cabeceras HTTP de seguridad (CSP, X-Frame, etc.)
app.use(morgan(ENV === 'production' ? 'combined' : 'dev')); // Log de requests

// Limitar a 300 peticiones por IP cada 15 minutos (protección básica contra abuso)
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas peticiones. Intenta en unos minutos.' }
}));

// ==================
// Parseo de requests
// ==================
app.use(cors());
app.use(express.json({ limit: '1mb' }));     // Límite en el body para evitar DoS
app.use(express.static(path.join(__dirname, 'public')));

// ==================
// Rutas del API
// ==================
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/productos', require('./routes/productos'));
app.use('/api/ordenes',   require('./routes/ordenes'));
app.use('/api/ventas',    require('./routes/ventas'));
app.use('/api/clientes',  require('./routes/clientes'));

// Ruta raíz → frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rutas de API desconocidas → JSON 404 (no HTML)
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.path}` });
});

// ==================
// Manejador global de errores
// ==================
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.isOperational) {
    // Error de negocio (AppError): mensaje seguro para el cliente
    return res.status(err.statusCode).json({ error: err.message });
  }
  // Error inesperado: loguear detalle, respuesta genérica al cliente
  console.error(`[ERROR ${new Date().toISOString()}]`, err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// ==================
// Arranque y apagado elegante
// ==================
const server = app.listen(PORT, () => {
  console.log(`☕ Café POS [${ENV}] corriendo en http://localhost:${PORT}`);
});

function shutdown(signal) {
  console.log(`\n[${signal}] Apagando servidor...`);
  server.close(() => {
    console.log('Servidor cerrado correctamente.');
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
