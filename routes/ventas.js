const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler');
const { verificarToken, soloAdmin } = require('../middleware/auth');
const VentasService = require('../services/ventasService');

router.use(verificarToken);
router.use(soloAdmin);

router.get('/', asyncHandler((req, res) => {
  res.json(VentasService.getAll());
}));

router.get('/hoy', asyncHandler((req, res) => {
  res.json(VentasService.getHoy());
}));

// GET /api/ventas/filtrar?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
router.get('/filtrar', asyncHandler((req, res) => {
  res.json(VentasService.filtrar(req.query.desde, req.query.hasta));
}));

router.get('/resumen', asyncHandler((req, res) => {
  res.json(VentasService.getResumen());
}));

module.exports = router;
