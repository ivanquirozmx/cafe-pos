const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');

// LEER todos (los más nuevos primero)
router.get('/', async (req, res) => {
  const customers = await Customer.find().sort({ createdAt: -1 });
  res.json(customers);
});

// CREAR
router.post('/', async (req, res) => {
  try {
    const customer = await Customer.create(req.body);
    res.status(201).json(customer);
  } catch (err) {
    if (err.code === 11000) {  // email duplicado
      return res.status(400).json({ error: 'Ya existe un cliente con ese email' });
    }
    // Errores de validación (required, match...)
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;