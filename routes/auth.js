// ============================================
// routes/auth.js - Login y sesión
// ============================================

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { leerJSON } = require('../utils/jsonDB');

const USUARIOS_PATH = path.join(__dirname, '../data/usuarios.json');
const JWT_SECRET = process.env.JWT_SECRET || 'cafe-pos-dev-secret';

// POST /api/auth/login — Body: { usuario, password }
router.post('/login', asyncHandler((req, res) => {
  const { usuario, password } = req.body;

  if (!usuario?.trim() || !password) {
    throw new AppError('Usuario y contraseña son requeridos');
  }

  const usuarios = leerJSON(USUARIOS_PATH);
  const user = usuarios.find(u => u.usuario === usuario.trim().toLowerCase());

  if (!user || !bcrypt.compareSync(password, user.password)) {
    throw new AppError('Credenciales incorrectas', 401);
  }

  const payload = { id: user.id, nombre: user.nombre, usuario: user.usuario, rol: user.rol };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });

  res.json({ token, usuario: payload });
}));

module.exports = router;
