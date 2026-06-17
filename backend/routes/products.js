const express = require('express');
const router = express.Router();        // un "mini servidor" solo para productos
const Product = require('../models/Product');

// LEER todos → GET /api/products
router.get('/', async (req, res) => {
  const products = await Product.find();  // trae todos de la base
  res.json(products);
});

// CREAR → POST /api/products
router.post('/', async (req, res) => {
  try {
    const product = await Product.create(req.body);  // req.body = datos que mandó el cliente
    res.status(201).json(product);                   // 201 = "creado con éxito"
  } catch (err) {
    res.status(400).json({ error: err.message });    // 400 = "datos inválidos"
  }
});

// ACTUALIZAR → PUT /api/products/:id
router.put('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// BORRAR → DELETE /api/products/:id
router.delete('/:id', async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ mensaje: 'Producto eliminado' });
});

module.exports = router;