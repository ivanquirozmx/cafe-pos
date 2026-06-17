// ============================================
// services/ventasService.js
// ============================================

const path = require('path');
const { leerJSON } = require('../utils/jsonDB');
const AppError = require('../utils/AppError');

const RUTA = path.join(__dirname, '../data/ventas.json');

function getAll() {
  return [...leerJSON(RUTA)].reverse();
}

function getHoy() {
  const ventas = leerJSON(RUTA);
  const hoy = new Date().toISOString().split('T')[0];
  const ventasHoy = ventas.filter(v => v.fecha.startsWith(hoy));

  return {
    fecha: hoy,
    cantidadVentas: ventasHoy.length,
    totalDelDia: ventasHoy.reduce((sum, v) => sum + v.total, 0),
    ventas: [...ventasHoy].reverse()
  };
}

function filtrar(desde, hasta) {
  if (!desde || !hasta) {
    throw new AppError('Se requieren los parámetros "desde" y "hasta" (YYYY-MM-DD)');
  }
  if (desde > hasta) {
    throw new AppError('La fecha inicial no puede ser mayor a la final');
  }

  const ventas = leerJSON(RUTA);
  const filtradas = ventas.filter(v => {
    const fecha = v.fecha.split('T')[0];
    return fecha >= desde && fecha <= hasta;
  });

  return {
    desde,
    hasta,
    cantidadVentas: filtradas.length,
    totalPeriodo: filtradas.reduce((sum, v) => sum + v.total, 0),
    ventas: [...filtradas].reverse()
  };
}

function getResumen() {
  const ventas = leerJSON(RUTA);
  const conteo = {};

  ventas.forEach(v => {
    v.items.forEach(item => {
      conteo[item.nombre] = (conteo[item.nombre] || 0) + item.cantidad;
    });
  });

  const masVendido = Object.entries(conteo).sort((a, b) => b[1] - a[1])[0];

  return {
    totalVentas: ventas.length,
    ingresoTotal: ventas.reduce((sum, v) => sum + v.total, 0),
    masVendido: masVendido ? { nombre: masVendido[0], cantidad: masVendido[1] } : null,
    productos: conteo
  };
}

module.exports = { getAll, getHoy, filtrar, getResumen };
