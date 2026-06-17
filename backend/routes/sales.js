const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Product = require('../models/Product');

// CREAR una venta → POST /api/sales
router.post('/', async (req, res) => {
  try {
    // El cliente nos manda: items [{ productId, quantity }], customer (opcional), discount (%)
    const { items, customer, discount = 0 } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'La venta no tiene productos' });
    }

    let subtotal = 0;
    const itemsVenta = [];

    // Recorremos cada producto del carrito
    for (const item of items) {
      const product = await Product.findById(item.productId);

      if (!product) {
        return res.status(400).json({ error: `Producto no encontrado` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({
          error: `Stock insuficiente de ${product.name} (quedan ${product.stock})`,
        });
      }

      // 1) Reducir el stock del producto
      product.stock -= item.quantity;
      await product.save();

      // 2) Acumular el importe y guardar la foto del item
      subtotal += product.price * item.quantity;
      itemsVenta.push({
        product:  product._id,
        name:     product.name,
        price:    product.price,
        quantity: item.quantity,
      });
    }

    // 3) Aplicar el descuento
    const total = subtotal - (subtotal * discount / 100);

    // 4) Guardar la venta = emitir el ticket
    const sale = await Sale.create({
      items: itemsVenta,
      customer: customer || undefined,
      subtotal,
      discount,
      total,
    });

    res.status(201).json(sale);  // devolvemos el ticket
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// LEER el historial → GET /api/sales
router.get('/', async (req, res) => {
  const sales = await Sale.find()
    .populate('customer', 'name email')  // trae el nombre/email del cliente
    .sort({ createdAt: -1 });            // las más recientes primero
  res.json(sales);
});


module.exports = router;