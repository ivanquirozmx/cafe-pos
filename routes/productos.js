const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler');
const { verificarToken, soloAdmin } = require('../middleware/auth');
const ProductosService = require('../services/productosService');

router.use(verificarToken);

router.get('/', asyncHandler((req, res) => {
  res.json(ProductosService.getAll());
}));

router.get('/disponibles', asyncHandler((req, res) => {
  res.json(ProductosService.getDisponibles());
}));

// POST /api/productos  — Admin only
router.post('/', soloAdmin, asyncHandler((req, res) => {
  const producto = ProductosService.crear(req.body);
  res.status(201).json({ mensaje: 'Producto creado', producto });
}));

// PUT /api/productos/:id  — Admin only
router.put('/:id', soloAdmin, asyncHandler((req, res) => {
  const producto = ProductosService.actualizar(req.params.id, req.body);
  res.json({ mensaje: 'Producto actualizado', producto });
}));

// PATCH /api/productos/:id/disponibilidad  — Admin only
router.patch('/:id/disponibilidad', soloAdmin, asyncHandler((req, res) => {
  const producto = ProductosService.toggleDisponibilidad(req.params.id);
  res.json({ mensaje: `Producto ${producto.disponible ? 'activado' : 'desactivado'}`, producto });
}));

module.exports = router;
