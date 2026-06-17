const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler');
const { verificarToken } = require('../middleware/auth');
const OrdenesService = require('../services/ordenesService');

router.use(verificarToken);

router.get('/actual', asyncHandler((req, res) => {
  res.json(OrdenesService.getActual());
}));

// POST /api/ordenes/agregar  — Body: { productoId }
router.post('/agregar', asyncHandler((req, res) => {
  res.json(OrdenesService.agregar(req.body.productoId));
}));

// DELETE /api/ordenes/quitar/:productoId
router.delete('/quitar/:productoId', asyncHandler((req, res) => {
  res.json(OrdenesService.quitar(req.params.productoId));
}));

// POST /api/ordenes/cliente  — Body: { clienteId }
router.post('/cliente', asyncHandler((req, res) => {
  res.json(OrdenesService.asignarCliente(req.body.clienteId));
}));

router.delete('/cliente', asyncHandler((req, res) => {
  res.json(OrdenesService.quitarCliente());
}));

// POST /api/ordenes/cobrar  — Body: { metodoPago }
router.post('/cobrar', asyncHandler((req, res) => {
  const venta = OrdenesService.cobrar(req.body.metodoPago);
  res.json({ mensaje: '¡Venta registrada!', venta });
}));

router.delete('/cancelar', asyncHandler((req, res) => {
  OrdenesService.cancelar();
  res.json({ mensaje: 'Orden cancelada' });
}));

module.exports = router;
