const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler');
const { verificarToken, soloAdmin } = require('../middleware/auth');
const ClientesService = require('../services/clientesService');

router.use(verificarToken);

router.get('/', asyncHandler((req, res) => {
  res.json(ClientesService.getAll());
}));

// GET /api/clientes/buscar?nombre=...
router.get('/buscar', asyncHandler((req, res) => {
  res.json(ClientesService.buscar(req.query.nombre));
}));

// POST /api/clientes  — Admin only
router.post('/', soloAdmin, asyncHandler((req, res) => {
  const cliente = ClientesService.crear(req.body);
  res.status(201).json({ mensaje: 'Cliente registrado', cliente });
}));

// PUT /api/clientes/:id  — Admin only
router.put('/:id', soloAdmin, asyncHandler((req, res) => {
  const cliente = ClientesService.actualizar(req.params.id, req.body);
  res.json({ mensaje: 'Cliente actualizado', cliente });
}));

// PATCH /api/clientes/:id/descuento  — Admin only
router.patch('/:id/descuento', soloAdmin, asyncHandler((req, res) => {
  const cliente = ClientesService.actualizarDescuento(req.params.id, req.body.descuento);
  res.json({ mensaje: `Descuento actualizado a ${cliente.descuento}%`, cliente });
}));

module.exports = router;
