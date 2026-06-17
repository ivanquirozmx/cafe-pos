// ============================================
// services/ordenesService.js
// ============================================

const path = require('path');
const { leerJSON, guardarJSON } = require('../utils/jsonDB');
const AppError = require('../utils/AppError');
const clientesService = require('./clientesService');

const ORDEN_PATH    = path.join(__dirname, '../data/orden-activa.json');
const VENTAS_PATH   = path.join(__dirname, '../data/ventas.json');
const PRODUCTOS_PATH = path.join(__dirname, '../data/productos.json');

const METODOS_VALIDOS = ['efectivo', 'tarjeta', 'transferencia'];

function leerOrden() {
  try {
    return leerJSON(ORDEN_PATH);
  } catch {
    return { items: [], clienteId: null };
  }
}

function calcularSubtotal(items) {
  return items.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
}

// Construye la respuesta completa de la orden con totales calculados.
// Todos los endpoints de mutación la devuelven para evitar un segundo fetch.
function buildRespuesta(orden) {
  const subtotal = calcularSubtotal(orden.items);
  let descuento = 0;
  let cliente = null;

  if (orden.clienteId) {
    try {
      const clientes = leerJSON(path.join(__dirname, '../data/clientes.json'));
      cliente = clientes.find(c => c.id === orden.clienteId) ?? null;
      if (cliente) {
        descuento = Number(((subtotal * cliente.descuento) / 100).toFixed(2));
      }
    } catch { /* si clientes.json falla, continuar sin descuento */ }
  }

  return {
    items: orden.items,
    cliente: cliente
      ? { id: cliente.id, nombre: cliente.nombre, descuento: cliente.descuento }
      : null,
    subtotal,
    descuento,
    total: Number((subtotal - descuento).toFixed(2))
  };
}

function getActual() {
  return buildRespuesta(leerOrden());
}

function agregar(productoId) {
  if (!productoId) throw new AppError('Se requiere productoId');

  const productos = leerJSON(PRODUCTOS_PATH);
  const producto = productos.find(p => p.id === Number(productoId));
  if (!producto) throw new AppError('Producto no encontrado', 404);
  if (!producto.disponible) throw new AppError('Producto no disponible');

  const orden = leerOrden();
  const existente = orden.items.find(i => i.productoId === producto.id);

  if (existente) {
    existente.cantidad += 1;
  } else {
    orden.items.push({
      productoId: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      cantidad: 1
    });
  }

  guardarJSON(ORDEN_PATH, orden);
  return buildRespuesta(orden);
}

function quitar(productoId) {
  const orden = leerOrden();
  const idx = orden.items.findIndex(i => i.productoId === Number(productoId));
  if (idx === -1) throw new AppError('Producto no está en la orden', 404);

  if (orden.items[idx].cantidad > 1) {
    orden.items[idx].cantidad -= 1;
  } else {
    orden.items.splice(idx, 1);
  }

  guardarJSON(ORDEN_PATH, orden);
  return buildRespuesta(orden);
}

function asignarCliente(clienteId) {
  const clientes = leerJSON(path.join(__dirname, '../data/clientes.json'));
  const cliente = clientes.find(c => c.id === Number(clienteId));
  if (!cliente) throw new AppError('Cliente no encontrado', 404);

  const orden = leerOrden();
  orden.clienteId = cliente.id;
  guardarJSON(ORDEN_PATH, orden);
  return buildRespuesta(orden);
}

function quitarCliente() {
  const orden = leerOrden();
  orden.clienteId = null;
  guardarJSON(ORDEN_PATH, orden);
  return buildRespuesta(orden);
}

function cobrar(metodoPago) {
  const orden = leerOrden();
  if (orden.items.length === 0) throw new AppError('La orden está vacía');

  const metodo = METODOS_VALIDOS.includes(metodoPago) ? metodoPago : 'efectivo';
  const subtotal = calcularSubtotal(orden.items);
  let descuento = 0;
  let clienteNombre = null;

  if (orden.clienteId) {
    const cliente = clientesService.incrementarVisitas(orden.clienteId);
    if (cliente) {
      clienteNombre = cliente.nombre;
      descuento = Number(((subtotal * cliente.descuento) / 100).toFixed(2));
    }
  }

  const venta = {
    id: Date.now(),
    fecha: new Date().toISOString(),
    items: [...orden.items],
    clienteNombre,
    subtotal,
    descuento,
    total: Number((subtotal - descuento).toFixed(2)),
    metodoPago: metodo
  };

  const ventas = leerJSON(VENTAS_PATH);
  ventas.push(venta);
  guardarJSON(VENTAS_PATH, ventas);
  guardarJSON(ORDEN_PATH, { items: [], clienteId: null });

  return venta;
}

function cancelar() {
  guardarJSON(ORDEN_PATH, { items: [], clienteId: null });
}

module.exports = { getActual, agregar, quitar, asignarCliente, quitarCliente, cobrar, cancelar };
