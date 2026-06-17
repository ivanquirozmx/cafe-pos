// ============================================
// services/productosService.js
// ============================================

const path = require('path');
const { leerJSON, guardarJSON } = require('../utils/jsonDB');
const AppError = require('../utils/AppError');

const RUTA = path.join(__dirname, '../data/productos.json');

function getAll() {
  return leerJSON(RUTA);
}

function getDisponibles() {
  return getAll().filter(p => p.disponible);
}

function _validarCampos({ nombre, categoria, precio }) {
  const nombreLimpio    = String(nombre ?? '').trim();
  const categoriaLimpia = String(categoria ?? '').trim();
  const precioNum       = Number(precio);

  if (!nombreLimpio || !categoriaLimpia) {
    throw new AppError('Nombre y categoría son requeridos');
  }
  if (isNaN(precioNum) || precioNum <= 0) {
    throw new AppError('El precio debe ser un número mayor a 0');
  }
  return { nombreLimpio, categoriaLimpia, precioNum };
}

function crear(data) {
  const { nombreLimpio, categoriaLimpia, precioNum } = _validarCampos(data);
  const productos = getAll();

  const nuevo = {
    id: Date.now(),
    nombre: nombreLimpio,
    categoria: categoriaLimpia,
    precio: precioNum,
    disponible: true,
    creadoEn: new Date().toISOString()
  };

  productos.push(nuevo);
  guardarJSON(RUTA, productos);
  return nuevo;
}

function actualizar(id, data) {
  const { nombreLimpio, categoriaLimpia, precioNum } = _validarCampos(data);
  const productos = getAll();
  const idx = productos.findIndex(p => p.id === Number(id));
  if (idx === -1) throw new AppError('Producto no encontrado', 404);

  productos[idx] = {
    ...productos[idx],
    nombre: nombreLimpio,
    categoria: categoriaLimpia,
    precio: precioNum,
    actualizadoEn: new Date().toISOString()
  };

  guardarJSON(RUTA, productos);
  return productos[idx];
}

function toggleDisponibilidad(id) {
  const productos = getAll();
  const producto = productos.find(p => p.id === Number(id));
  if (!producto) throw new AppError('Producto no encontrado', 404);

  producto.disponible = !producto.disponible;
  guardarJSON(RUTA, productos);
  return producto;
}

module.exports = { getAll, getDisponibles, crear, actualizar, toggleDisponibilidad };
