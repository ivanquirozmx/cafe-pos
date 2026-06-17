const mongoose = require('mongoose');

// El "molde": así se ve un producto en la base de datos
const productSchema = new mongoose.Schema({
  name:  { type: String, required: true },   // obligatorio
  price: { type: Number, required: true },   // obligatorio
  stock: { type: Number, default: 0 },       // si no se manda, vale 0
}, { timestamps: true });  // agrega fechas de creación/edición automáticas

module.exports = mongoose.model('Product', productSchema);