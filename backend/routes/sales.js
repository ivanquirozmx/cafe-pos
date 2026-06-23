const express = require('express');
const router = express.Router();
const Sale    = require('../models/sale');
const Product = require('../models/product');

// CREAR una venta → POST /api/sales
router.post('/', async (req, res) => {
  try {
    const { items, customer, discount = 0 } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'La venta no tiene productos' });
    }

    let subtotal = 0;
    const itemsVenta = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) return res.status(400).json({ error: 'Producto no encontrado' });
      if (product.stock < item.quantity) {
        return res.status(400).json({
          error: `Stock insuficiente de ${product.name} (quedan ${product.stock})`,
        });
      }
      product.stock -= item.quantity;
      await product.save();
      subtotal += product.price * item.quantity;
      itemsVenta.push({ product: product._id, name: product.name, price: product.price, quantity: item.quantity });
    }

    const total = subtotal - (subtotal * discount / 100);
    const sale = await Sale.create({ items: itemsVenta, customer: customer || undefined, subtotal, discount, total });
    res.status(201).json(sale);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// LEER historial → GET /api/sales
router.get('/', async (req, res) => {
  const sales = await Sale.find()
    .populate('customer', 'name email')
    .sort({ createdAt: -1 });
  res.json(sales);
});

module.exports = router;
