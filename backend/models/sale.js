const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  items: [                          // una venta tiene varios productos
    {
      product:  { type: mongoose.Schema.Types.ObjectId, ref: 'product' },
      name:     String,             // guardamos el nombre del momento de la venta
      price:    Number,             // y el precio del momento de la venta
      quantity: Number,
    },
  ],
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'customer' }, // opcional
  subtotal: Number,
  discount: Number,                 // porcentaje de descuento
  total:    Number,
}, { timestamps: true });

module.exports = mongoose.model('sale', saleSchema);