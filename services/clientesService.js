// ============================================
// services/clientesService.js
// ============================================

const path = require('path');
const { leerJSON, guardarJSON } = require('../utils/jsonDB');
const AppError = require('../utils/AppError');

const RUTA = path.join(__dirname, '../data/clientes.json');

function getAll() {
  return leerJSON(RUTA);
}

function buscar(nombre) {
  if (!nombre?.trim()) return [];
  const texto = nombre.toLowerCase();
  return getAll().filter(c => c.nombre.toLowerCase().includes(texto));
}

function _validarCampos({ nombre, telefono, notas }) {
  const nombreLimpio   = String(nombre   ?? '').trim();
  const telefonoLimpio = String(telefono ?? '').trim();
  const notasLimpias   = String(notas    ?? '').trim();

  if (!nombreLimpio)   throw new AppError('El nombre es requerido');
  if (!telefonoLimpio) throw new AppError('El teléfono es requerido');

  return { nombreLimpio, telefonoLimpio, notasLimpias };
}

function crear(data) {
  const { nombreLimpio, telefonoLimpio, notasLimpias } = _validarCampos(data);
  const clientes = getAll();

  const nuevo = {
    id: Date.now(),
    nombre: nombreLimpio,
    telefono: telefonoLimpio,
    visitas: 0,
    descuento: 0,
    notas: notasLimpias,
    creadoEn: new Date().toISOString()
  };

  clientes.push(nuevo);
  guardarJSON(RUTA, clientes);
  return nuevo;
}

function actualizar(id, data) {
  const { nombreLimpio, telefonoLimpio, notasLimpias } = _validarCampos(data);
  const clientes = getAll();
  const idx = clientes.findIndex(c => c.id === Number(id));
  if (idx === -1) throw new AppError('Cliente no encontrado', 404);

  clientes[idx] = {
    ...clientes[idx],
    nombre: nombreLimpio,
    telefono: telefonoLimpio,
    notas: notasLimpias,
    actualizadoEn: new Date().toISOString()
  };

  guardarJSON(RUTA, clientes);
  return clientes[idx];
}

function actualizarDescuento(id, descuento) {
  const descuentoNum = Number(descuento);
  if (isNaN(descuentoNum) || descuentoNum < 0 || descuentoNum > 100) {
    throw new AppError('El descuento debe estar entre 0 y 100');
  }

  const clientes = getAll();
  const cliente = clientes.find(c => c.id === Number(id));
  if (!cliente) throw new AppError('Cliente no encontrado', 404);

  cliente.descuento = descuentoNum;
  guardarJSON(RUTA, clientes);
  return cliente;
}

function incrementarVisitas(id) {
  const clientes = getAll();
  const cliente = clientes.find(c => c.id === Number(id));
  if (cliente) {
    cliente.visitas += 1;
    guardarJSON(RUTA, clientes);
  }
  return cliente;
}

module.exports = { getAll, buscar, crear, actualizar, actualizarDescuento, incrementarVisitas };
