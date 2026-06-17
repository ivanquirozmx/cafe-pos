const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre es obligatorio'],  // mensaje personalizado
    trim: true,                                     // quita espacios sobrantes
  },
  email: {
    type: String,
    required: [true, 'El email es obligatorio'],
    unique: true,                                   // no se permite repetido
    lowercase: true,                                // se guarda en minúsculas
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'El email no tiene un formato válido'],
  },
  phone: {
    type: String,
    trim: true,                                     // opcional
  },
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);