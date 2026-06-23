const express = require('express');
const router = express.Router();
const Product = require('../models/product.js');

// LEER todos → GET /api/products
router.get('/', async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

// CREAR → POST /api/products
router.post('/', async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
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
