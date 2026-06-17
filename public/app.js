// ============================================
// public/app.js - Lógica del frontend
// ============================================

const API = '/api';

// --- Estado de la aplicación ---
let sesion = null;           // { token, usuario: { id, nombre, usuario, rol } }
let todosLosProductos = [];
let categoriaActiva = 'Todos';
let cargandoOrden = false;
let productoEditandoId = null;
let clienteEditandoId = null;

// ==================
// Seguridad: escape de HTML para prevenir XSS
// ==================
function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// ==================
// Fecha local (no UTC) para evitar desfase de zona horaria
// ==================
function fechaLocal() {
  const ahora = new Date();
  const y = ahora.getFullYear();
  const m = String(ahora.getMonth() + 1).padStart(2, '0');
  const d = String(ahora.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ==================
// Fetch autenticado — agrega token JWT y redirige al login si expira
// ==================
async function apiFetch(url, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (sesion?.token) headers['Authorization'] = `Bearer ${sesion.token}`;
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) {
    cerrarSesion();
    throw new Error('Sesión expirada');
  }
  return res;
}

// ==================
// Autenticación
// ==================
async function iniciarSesion(e) {
  e.preventDefault();
  const btnLogin = document.getElementById('btn-login');
  const errorEl = document.getElementById('login-error');
  const usuario  = document.getElementById('login-usuario').value.trim();
  const password = document.getElementById('login-password').value;

  btnLogin.disabled = true;
  btnLogin.textContent = 'Entrando...';
  errorEl.classList.add('oculto');

  try {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, password })
    });
    const datos = await res.json();

    if (res.ok) {
      sesion = datos;
      localStorage.setItem('sesion', JSON.stringify(sesion));
      mostrarApp();
    } else {
      errorEl.textContent = datos.error || 'Credenciales incorrectas';
      errorEl.classList.remove('oculto');
    }
  } catch {
    errorEl.textContent = 'Error de conexión. Verifica que el servidor esté activo.';
    errorEl.classList.remove('oculto');
  } finally {
    btnLogin.disabled = false;
    btnLogin.textContent = 'Entrar';
  }
}

function cerrarSesion() {
  sesion = null;
  localStorage.removeItem('sesion');
  document.getElementById('app-contenido').classList.add('oculto');
  document.getElementById('pantalla-login').classList.remove('oculto');
  document.getElementById('form-login').reset();
  document.getElementById('login-error').classList.add('oculto');
}

function mostrarApp() {
  document.getElementById('pantalla-login').classList.add('oculto');
  document.getElementById('app-contenido').classList.remove('oculto');
  document.getElementById('usuario-nombre').textContent = sesion.usuario.nombre;

  // Ocultar tabs de admin para vendedores
  const esAdmin = sesion.usuario.rol === 'admin';
  document.querySelectorAll('.tab-admin').forEach(el => {
    el.style.display = esAdmin ? '' : 'none';
  });

  // Asegurarnos de que el tab activo sea POS
  activarTab('pos');

  actualizarFechaHora();
  setInterval(actualizarFechaHora, 1000);
  cargarProductos();
  cargarOrdenActual();
  inicializarFechasFiltro();
}

// ==================
// Inicialización
// ==================
document.addEventListener('DOMContentLoaded', () => {
  // Restaurar sesión guardada
  const guardada = localStorage.getItem('sesion');
  if (guardada) {
    try {
      sesion = JSON.parse(guardada);
      mostrarApp();
    } catch {
      localStorage.removeItem('sesion');
    }
  }

  // Login
  document.getElementById('form-login').addEventListener('submit', iniciarSesion);
  document.getElementById('btn-logout').addEventListener('click', () => {
    confirmar('¿Cerrar sesión?', cerrarSesion);
  });

  // Tabs
  inicializarTabs();

  // POS — buscar cliente
  let timerCliente;
  document.getElementById('buscar-cliente').addEventListener('input', e => {
    clearTimeout(timerCliente);
    timerCliente = setTimeout(() => buscarCliente(e.target.value), 350);
  });

  document.getElementById('btn-cobrar').addEventListener('click', cobrar);
  document.getElementById('btn-cancelar').addEventListener('click', () => {
    confirmar('¿Cancelar la orden actual?', async () => {
      await apiFetch(`${API}/ordenes/cancelar`, { method: 'DELETE' });
      document.getElementById('buscar-cliente').value = '';
      cargarOrdenActual();
      mostrarToast('Orden cancelada', 'info');
    });
  });
  document.getElementById('btn-quitar-cliente').addEventListener('click', quitarCliente);

  // Historial
  document.getElementById('btn-filtrar-ventas').addEventListener('click', filtrarVentas);
  document.getElementById('btn-ventas-hoy').addEventListener('click', cargarVentasHoy);

  // Modal de venta exitosa
  document.getElementById('btn-nueva-orden').addEventListener('click', cerrarModal);

  // Modal de productos
  document.getElementById('btn-nuevo-producto').addEventListener('click', () => abrirModalProducto());
  document.getElementById('btn-cerrar-modal-producto').addEventListener('click', cerrarModalProducto);
  document.getElementById('form-producto').addEventListener('submit', guardarProducto);

  // Modal de clientes
  document.getElementById('btn-nuevo-cliente').addEventListener('click', () => abrirModalCliente());
  document.getElementById('btn-cerrar-modal-cliente').addEventListener('click', cerrarModalCliente);
  document.getElementById('form-cliente').addEventListener('submit', guardarCliente);

  // Modal de confirmación
  document.getElementById('btn-confirmar-cancel').addEventListener('click', cerrarModalConfirmar);

  // Filtros de categoría (event delegation)
  inicializarFiltrosCategoriaListener();
});

// ==================
// Tabs
// ==================
function inicializarTabs() {
  document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => activarTab(btn.dataset.tab));
  });
}

function activarTab(tab) {
  document.querySelectorAll('.tab').forEach(b => b.classList.remove('activo'));
  document.querySelectorAll('.tab-contenido').forEach(c => c.classList.add('oculto'));

  const btnTab = document.querySelector(`.tab[data-tab="${tab}"]`);
  if (btnTab) btnTab.classList.add('activo');
  document.getElementById(`tab-${tab}`)?.classList.remove('oculto');

  if (tab === 'historial') cargarVentasHoy();
  if (tab === 'productos') cargarAdminProductos();
  if (tab === 'clientes') cargarAdminClientes();
}

// ==================
// Fecha y hora
// ==================
function actualizarFechaHora() {
  const ahora = new Date();
  document.getElementById('fecha-hora').textContent =
    ahora.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    + ' — ' + ahora.toLocaleTimeString('es-MX');
}

// ==================
// Toast de notificaciones
// ==================
let toastTimer;
function mostrarToast(mensaje, tipo = 'info') {
  clearTimeout(toastTimer);
  const toast = document.getElementById('toast');
  toast.textContent = mensaje;
  toast.className = `toast toast-${tipo}`;
  toastTimer = setTimeout(() => toast.classList.add('oculto'), 3000);
}

// ==================
// Modal de confirmación
// ==================
function confirmar(mensaje, callback) {
  document.getElementById('msg-confirmar').textContent = mensaje;
  document.getElementById('modal-confirmar').classList.remove('oculto');
  const btn = document.getElementById('btn-confirmar-ok');
  const btnNuevo = btn.cloneNode(true);
  btn.parentNode.replaceChild(btnNuevo, btn);
  btnNuevo.addEventListener('click', () => {
    cerrarModalConfirmar();
    callback();
  });
}

function cerrarModalConfirmar() {
  document.getElementById('modal-confirmar').classList.add('oculto');
}

// ==================
// Productos / Menú
// ==================
async function cargarProductos() {
  try {
    const res = await apiFetch(`${API}/productos`);
    if (!res.ok) throw new Error();
    todosLosProductos = await res.json();
    renderizarFiltros();
    renderizarProductos(todosLosProductos);
  } catch {
    document.getElementById('lista-productos').innerHTML =
      '<p class="estado-error">No se pudieron cargar los productos.</p>';
  }
}

function inicializarFiltrosCategoriaListener() {
  document.getElementById('filtros-categoria').addEventListener('click', e => {
    const btn = e.target.closest('.btn-categoria');
    if (btn) filtrarCategoria(btn.dataset.cat);
  });
}

function renderizarFiltros() {
  const categorias = ['Todos', ...new Set(todosLosProductos.map(p => p.categoria))];
  const contenedor = document.getElementById('filtros-categoria');
  contenedor.innerHTML = categorias.map(cat => `
    <button class="btn-categoria ${cat === categoriaActiva ? 'activo' : ''}" data-cat="${esc(cat)}">
      ${esc(cat)}
    </button>
  `).join('');
}

function filtrarCategoria(categoria) {
  categoriaActiva = categoria;
  renderizarFiltros();
  const filtrados = categoria === 'Todos'
    ? todosLosProductos
    : todosLosProductos.filter(p => p.categoria === categoria);
  renderizarProductos(filtrados);
}

function renderizarProductos(productos) {
  const contenedor = document.getElementById('lista-productos');
  const disponibles = productos.filter(p => p.disponible);
  const nodisponibles = productos.filter(p => !p.disponible);
  const ordenados = [...disponibles, ...nodisponibles];

  if (ordenados.length === 0) {
    contenedor.innerHTML = '<p class="estado-vacio">No hay productos en esta categoría.</p>';
    return;
  }

  contenedor.innerHTML = ordenados.map(p => `
    <div class="tarjeta-producto ${!p.disponible ? 'no-disponible' : ''}"
         data-id="${p.id}" data-disponible="${p.disponible}">
      <div class="nombre">${esc(p.nombre)}</div>
      <div class="precio">$${p.precio.toFixed(2)}</div>
      <div class="categoria">${esc(p.categoria)}</div>
      ${!p.disponible ? '<div class="badge-no-disp">Sin stock</div>' : ''}
    </div>
  `).join('');

  contenedor.onclick = e => {
    const tarjeta = e.target.closest('.tarjeta-producto');
    if (tarjeta && tarjeta.dataset.disponible === 'true') {
      agregarProducto(Number(tarjeta.dataset.id));
    }
  };
}

// ==================
// Orden actual
// ==================
async function cargarOrdenActual() {
  if (cargandoOrden) return;
  cargandoOrden = true;
  try {
    const res = await apiFetch(`${API}/ordenes/actual`);
    if (!res.ok) throw new Error();
    renderizarOrden(await res.json());
  } catch {
    mostrarToast('Error al cargar la orden', 'error');
  } finally {
    cargandoOrden = false;
  }
}

function renderizarOrden(datos) {
  const lista = document.getElementById('lista-orden');

  if (datos.items.length === 0) {
    lista.innerHTML = '<p class="orden-vacia">Agrega productos al pedido</p>';
    document.getElementById('btn-cobrar').disabled = true;
  } else {
    lista.innerHTML = datos.items.map(item => `
      <div class="item-orden">
        <span class="nombre">${esc(item.nombre)}</span>
        <div class="controles-cantidad">
          <button data-accion="quitar" data-id="${item.productoId}" aria-label="Quitar uno">−</button>
          <span>${item.cantidad}</span>
          <button data-accion="agregar" data-id="${item.productoId}" aria-label="Agregar uno">+</button>
        </div>
        <span class="item-precio">$${(item.precio * item.cantidad).toFixed(2)}</span>
      </div>
    `).join('');

    lista.onclick = e => {
      const btn = e.target.closest('button[data-accion]');
      if (!btn) return;
      const id = Number(btn.dataset.id);
      if (btn.dataset.accion === 'agregar') agregarProducto(id);
      else quitarProducto(id);
    };

    document.getElementById('btn-cobrar').disabled = false;
  }

  document.getElementById('subtotal').textContent = `$${datos.subtotal.toFixed(2)}`;
  document.getElementById('descuento').textContent = `-$${datos.descuento.toFixed(2)}`;
  document.getElementById('total').textContent = `$${datos.total.toFixed(2)}`;
  document.getElementById('fila-descuento').style.display = datos.descuento > 0 ? 'flex' : 'none';

  const btnQuitar = document.getElementById('btn-quitar-cliente');
  if (datos.cliente) {
    document.getElementById('resultado-cliente').innerHTML = `
      <div class="cliente-asignado">
        👤 ${esc(datos.cliente.nombre)}
        ${datos.cliente.descuento > 0 ? `<span class="badge-descuento">${datos.cliente.descuento}% off</span>` : ''}
      </div>`;
    btnQuitar.classList.remove('oculto');
  } else {
    btnQuitar.classList.add('oculto');
  }
}

async function agregarProducto(productoId) {
  try {
    const res = await apiFetch(`${API}/ordenes/agregar`, {
      method: 'POST',
      body: JSON.stringify({ productoId })
    });
    if (!res.ok) {
      const err = await res.json();
      mostrarToast(err.error || 'Error al agregar', 'error');
      return;
    }
    renderizarOrden(await res.json());
  } catch {
    mostrarToast('Error de conexión', 'error');
  }
}

async function quitarProducto(productoId) {
  try {
    const res = await apiFetch(`${API}/ordenes/quitar/${productoId}`, { method: 'DELETE' });
    if (!res.ok) return;
    renderizarOrden(await res.json());
  } catch {
    mostrarToast('Error de conexión', 'error');
  }
}

// ==================
// Clientes frecuentes (POS)
// ==================
async function buscarCliente(texto) {
  const contenedor = document.getElementById('resultado-cliente');
  if (!texto.trim()) { contenedor.innerHTML = ''; return; }

  try {
    const res = await apiFetch(`${API}/clientes/buscar?nombre=${encodeURIComponent(texto)}`);
    const clientes = await res.json();

    if (clientes.length === 0) {
      contenedor.innerHTML = '<small class="sin-resultados">Sin resultados</small>';
      return;
    }

    contenedor.innerHTML = clientes.map(c => `
      <div class="sugerencia-cliente" data-id="${c.id}">
        <span>${esc(c.nombre)}</span>
        ${c.descuento > 0 ? `<span class="badge-descuento">${c.descuento}% off</span>` : ''}
      </div>
    `).join('');

    contenedor.onclick = e => {
      const sug = e.target.closest('.sugerencia-cliente');
      if (sug) asignarCliente(Number(sug.dataset.id));
    };
  } catch {
    contenedor.innerHTML = '';
  }
}

async function asignarCliente(clienteId) {
  try {
    const res = await apiFetch(`${API}/ordenes/cliente`, {
      method: 'POST',
      body: JSON.stringify({ clienteId })
    });
    document.getElementById('buscar-cliente').value = '';
    document.getElementById('resultado-cliente').innerHTML = '';
    renderizarOrden(await res.json());
  } catch {
    mostrarToast('Error al asignar cliente', 'error');
  }
}

async function quitarCliente() {
  try {
    const res = await apiFetch(`${API}/ordenes/cliente`, { method: 'DELETE' });
    renderizarOrden(await res.json());
  } catch {
    mostrarToast('Error al quitar cliente', 'error');
  }
}

// ==================
// Cobrar
// ==================
async function cobrar() {
  const btn = document.getElementById('btn-cobrar');
  btn.disabled = true;
  btn.textContent = 'Procesando...';

  try {
    const metodoPago = document.getElementById('metodo-pago').value;
    const res = await apiFetch(`${API}/ordenes/cobrar`, {
      method: 'POST',
      body: JSON.stringify({ metodoPago })
    });
    const datos = await res.json();

    if (res.ok) {
      const v = datos.venta;
      const metodosIcono = { efectivo: '💵', tarjeta: '💳', transferencia: '📱' };
      document.getElementById('detalle-venta').innerHTML = `
        <table class="tabla-ticket">
          <thead><tr><th>Producto</th><th>Cant.</th><th>Precio</th></tr></thead>
          <tbody>
            ${v.items.map(i => `
              <tr>
                <td>${esc(i.nombre)}</td>
                <td>${i.cantidad}</td>
                <td>$${(i.precio * i.cantidad).toFixed(2)}</td>
              </tr>`).join('')}
          </tbody>
        </table>
        <div class="ticket-totales">
          <div class="ticket-fila"><span>Subtotal</span><span>$${v.subtotal.toFixed(2)}</span></div>
          ${v.descuento > 0 ? `<div class="ticket-fila descuento"><span>Descuento</span><span>-$${v.descuento.toFixed(2)}</span></div>` : ''}
          <div class="ticket-fila total"><span>Total</span><span>$${v.total.toFixed(2)}</span></div>
          <div class="ticket-fila"><span>Pago</span><span>${esc(metodosIcono[v.metodoPago] || '')} ${esc(v.metodoPago)}</span></div>
          ${v.clienteNombre ? `<div class="ticket-fila"><span>Cliente</span><span>${esc(v.clienteNombre)}</span></div>` : ''}
        </div>
      `;
      document.getElementById('modal-exito').classList.remove('oculto');
    } else {
      mostrarToast(datos.error || 'Error al cobrar', 'error');
      btn.disabled = false;
      btn.textContent = 'Cobrar';
    }
  } catch {
    mostrarToast('Error de conexión al cobrar', 'error');
    btn.disabled = false;
    btn.textContent = 'Cobrar';
  }
}

function cerrarModal() {
  document.getElementById('modal-exito').classList.add('oculto');
  document.getElementById('resultado-cliente').innerHTML = '';
  document.getElementById('btn-cobrar').textContent = 'Cobrar';
  cargarOrdenActual();
}

// ==================
// Historial de ventas
// ==================
function inicializarFechasFiltro() {
  const hoy = fechaLocal();
  document.getElementById('fecha-desde').value = hoy;
  document.getElementById('fecha-hasta').value = hoy;
}

async function cargarVentasHoy() {
  const hoy = fechaLocal();
  document.getElementById('fecha-desde').value = hoy;
  document.getElementById('fecha-hasta').value = hoy;

  try {
    const [resHoy, resResumen] = await Promise.all([
      apiFetch(`${API}/ventas/hoy`),
      apiFetch(`${API}/ventas/resumen`)
    ]);
    const hoyData = await resHoy.json();
    const resumen = await resResumen.json();

    renderizarHistorial(hoyData.ventas, hoyData.cantidadVentas, hoyData.totalDelDia);
    actualizarResumenCards(hoyData.cantidadVentas, hoyData.totalDelDia, resumen.masVendido);
  } catch {
    document.getElementById('tabla-ventas').innerHTML =
      '<p class="estado-error">Error al cargar el historial.</p>';
  }
}

async function filtrarVentas() {
  const desde = document.getElementById('fecha-desde').value;
  const hasta = document.getElementById('fecha-hasta').value;

  if (!desde || !hasta) { mostrarToast('Selecciona un rango de fechas', 'error'); return; }
  if (desde > hasta) { mostrarToast('La fecha inicial no puede ser mayor a la final', 'error'); return; }

  try {
    const res = await apiFetch(`${API}/ventas/filtrar?desde=${desde}&hasta=${hasta}`);
    const datos = await res.json();
    renderizarHistorial(datos.ventas, datos.cantidadVentas, datos.totalPeriodo);
    actualizarResumenCards(datos.cantidadVentas, datos.totalPeriodo, null);
  } catch {
    mostrarToast('Error al filtrar ventas', 'error');
  }
}

function actualizarResumenCards(cantidad, total, masVendido) {
  document.getElementById('res-cantidad').textContent = cantidad;
  document.getElementById('res-total').textContent = `$${total.toFixed(2)}`;
  document.getElementById('res-mas-vendido').textContent = masVendido ? esc(masVendido.nombre) : '—';
}

function renderizarHistorial(ventas, cantidad, total) {
  const contenedor = document.getElementById('tabla-ventas');

  if (ventas.length === 0) {
    contenedor.innerHTML = '<p class="estado-vacio">No hay ventas en este período.</p>';
    return;
  }

  const metodoIcono = { efectivo: '💵', tarjeta: '💳', transferencia: '📱' };

  contenedor.innerHTML = `
    <div class="tabla-scroll">
      <table class="tabla-historial">
        <thead>
          <tr>
            <th>Hora</th><th>Productos</th><th>Cliente</th><th>Método</th><th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${ventas.map(v => {
            const fecha = new Date(v.fecha);
            const hora = fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
            const dia  = fecha.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
            const productos = v.items.map(i => `${esc(i.nombre)} ×${i.cantidad}`).join(', ');
            return `
              <tr>
                <td><span class="fecha-dia">${esc(dia)}</span><br/><span class="fecha-hora">${esc(hora)}</span></td>
                <td class="celda-productos">${productos}</td>
                <td>${v.clienteNombre ? esc(v.clienteNombre) : '—'}</td>
                <td>${esc(metodoIcono[v.metodoPago] || '')} ${esc(v.metodoPago)}</td>
                <td class="celda-total">$${v.total.toFixed(2)}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// ==================
// Admin: Productos
// ==================
async function cargarAdminProductos() {
  const contenedor = document.getElementById('admin-lista-productos');
  try {
    const res = await apiFetch(`${API}/productos`);
    const productos = await res.json();

    if (productos.length === 0) {
      contenedor.innerHTML = '<p class="estado-vacio">No hay productos registrados.</p>';
      return;
    }

    contenedor.innerHTML = `
      <div class="tabla-scroll">
        <table class="tabla-historial">
          <thead>
            <tr><th>Nombre</th><th>Categoría</th><th>Precio</th><th>Estado</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            ${productos.map(p => `
              <tr class="${!p.disponible ? 'fila-inactiva' : ''}">
                <td>${esc(p.nombre)}</td>
                <td>${esc(p.categoria)}</td>
                <td>$${p.precio.toFixed(2)}</td>
                <td>
                  <span class="badge ${p.disponible ? 'badge-activo' : 'badge-inactivo'}">
                    ${p.disponible ? 'Disponible' : 'Sin stock'}
                  </span>
                </td>
                <td class="celda-acciones">
                  <button class="btn-tabla btn-editar-prod" data-id="${p.id}"
                          data-nombre="${esc(p.nombre)}" data-categoria="${esc(p.categoria)}"
                          data-precio="${p.precio}">
                    Editar
                  </button>
                  <button class="btn-tabla btn-toggle-prod" data-id="${p.id}">
                    ${p.disponible ? 'Desactivar' : 'Activar'}
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    contenedor.onclick = e => {
      const btnEditar = e.target.closest('.btn-editar-prod');
      const btnToggle = e.target.closest('.btn-toggle-prod');
      if (btnEditar) {
        abrirModalProducto({
          id:        Number(btnEditar.dataset.id),
          nombre:    btnEditar.dataset.nombre,
          categoria: btnEditar.dataset.categoria,
          precio:    Number(btnEditar.dataset.precio)
        });
      } else if (btnToggle) {
        toggleDisponibilidad(Number(btnToggle.dataset.id));
      }
    };
  } catch {
    contenedor.innerHTML = '<p class="estado-error">Error al cargar productos.</p>';
  }
}

async function toggleDisponibilidad(productoId) {
  try {
    await apiFetch(`${API}/productos/${productoId}/disponibilidad`, { method: 'PATCH' });
    cargarAdminProductos();
    cargarProductos();
    mostrarToast('Disponibilidad actualizada', 'success');
  } catch {
    mostrarToast('Error al actualizar disponibilidad', 'error');
  }
}

function abrirModalProducto(prod = null) {
  productoEditandoId = prod ? prod.id : null;
  document.getElementById('titulo-modal-producto').textContent =
    prod ? 'Editar Producto' : 'Nuevo Producto';
  document.getElementById('btn-submit-producto').textContent =
    prod ? 'Guardar cambios' : 'Guardar';

  if (prod) {
    document.getElementById('prod-nombre').value    = prod.nombre;
    document.getElementById('prod-categoria').value = prod.categoria;
    document.getElementById('prod-precio').value    = prod.precio;
  } else {
    document.getElementById('form-producto').reset();
  }

  document.getElementById('modal-producto').classList.remove('oculto');
}

function cerrarModalProducto() {
  document.getElementById('modal-producto').classList.add('oculto');
  productoEditandoId = null;
}

async function guardarProducto(e) {
  e.preventDefault();
  const nombre    = document.getElementById('prod-nombre').value.trim();
  const categoria = document.getElementById('prod-categoria').value.trim();
  const precio    = Number(document.getElementById('prod-precio').value);

  try {
    const url    = productoEditandoId ? `${API}/productos/${productoEditandoId}` : `${API}/productos`;
    const method = productoEditandoId ? 'PUT' : 'POST';

    const res = await apiFetch(url, {
      method,
      body: JSON.stringify({ nombre, categoria, precio })
    });

    if (res.ok) {
      cerrarModalProducto();
      cargarAdminProductos();
      cargarProductos();
      mostrarToast(productoEditandoId ? 'Producto actualizado' : 'Producto creado', 'success');
    } else {
      const err = await res.json();
      mostrarToast(err.error || 'Error al guardar', 'error');
    }
  } catch {
    mostrarToast('Error de conexión', 'error');
  }
}

// ==================
// Admin: Clientes
// ==================
async function cargarAdminClientes() {
  const contenedor = document.getElementById('admin-lista-clientes');
  try {
    const res = await apiFetch(`${API}/clientes`);
    const clientes = await res.json();

    if (clientes.length === 0) {
      contenedor.innerHTML = '<p class="estado-vacio">No hay clientes registrados.</p>';
      return;
    }

    contenedor.innerHTML = `
      <div class="tabla-scroll">
        <table class="tabla-historial">
          <thead>
            <tr><th>Nombre</th><th>Teléfono</th><th>Visitas</th><th>Descuento</th><th>Notas</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            ${clientes.map(c => `
              <tr>
                <td>${esc(c.nombre)}</td>
                <td>${c.telefono ? esc(c.telefono) : '—'}</td>
                <td>${c.visitas}</td>
                <td>
                  <div class="descuento-inline">
                    <input type="number" class="input-descuento" data-id="${c.id}"
                           value="${c.descuento}" min="0" max="100" />
                    <span>%</span>
                    <button class="btn-tabla btn-guardar-desc" data-id="${c.id}">✓</button>
                  </div>
                </td>
                <td>${c.notas ? esc(c.notas) : '—'}</td>
                <td>
                  <button class="btn-tabla btn-editar-cli"
                          data-id="${c.id}"
                          data-nombre="${esc(c.nombre)}"
                          data-telefono="${esc(c.telefono || '')}"
                          data-notas="${esc(c.notas || '')}">
                    Editar
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    contenedor.onclick = e => {
      const btnDesc  = e.target.closest('.btn-guardar-desc');
      const btnEditar = e.target.closest('.btn-editar-cli');
      if (btnDesc) {
        actualizarDescuento(Number(btnDesc.dataset.id));
      } else if (btnEditar) {
        abrirModalCliente({
          id:       Number(btnEditar.dataset.id),
          nombre:   btnEditar.dataset.nombre,
          telefono: btnEditar.dataset.telefono,
          notas:    btnEditar.dataset.notas
        });
      }
    };
  } catch {
    contenedor.innerHTML = '<p class="estado-error">Error al cargar clientes.</p>';
  }
}

async function actualizarDescuento(clienteId) {
  const input = document.querySelector(`.input-descuento[data-id="${clienteId}"]`);
  const descuento = Number(input.value);
  try {
    const res = await apiFetch(`${API}/clientes/${clienteId}/descuento`, {
      method: 'PATCH',
      body: JSON.stringify({ descuento })
    });
    if (res.ok) {
      mostrarToast('Descuento actualizado', 'success');
    } else {
      const err = await res.json();
      mostrarToast(err.error || 'Error al actualizar', 'error');
    }
  } catch {
    mostrarToast('Error de conexión', 'error');
  }
}

function abrirModalCliente(cli = null) {
  clienteEditandoId = cli ? cli.id : null;
  document.getElementById('titulo-modal-cliente').textContent =
    cli ? 'Editar Cliente' : 'Nuevo Cliente';
  document.getElementById('btn-submit-cliente').textContent =
    cli ? 'Guardar cambios' : 'Registrar';

  if (cli) {
    document.getElementById('cli-nombre').value   = cli.nombre;
    document.getElementById('cli-telefono').value = cli.telefono;
    document.getElementById('cli-notas').value    = cli.notas;
  } else {
    document.getElementById('form-cliente').reset();
  }

  document.getElementById('modal-cliente').classList.remove('oculto');
}

function cerrarModalCliente() {
  document.getElementById('modal-cliente').classList.add('oculto');
  clienteEditandoId = null;
}

async function guardarCliente(e) {
  e.preventDefault();
  const nombre   = document.getElementById('cli-nombre').value.trim();
  const telefono = document.getElementById('cli-telefono').value.trim();
  const notas    = document.getElementById('cli-notas').value.trim();

  try {
    const url    = clienteEditandoId ? `${API}/clientes/${clienteEditandoId}` : `${API}/clientes`;
    const method = clienteEditandoId ? 'PUT' : 'POST';

    const res = await apiFetch(url, {
      method,
      body: JSON.stringify({ nombre, telefono, notas })
    });

    if (res.ok) {
      cerrarModalCliente();
      cargarAdminClientes();
      mostrarToast(clienteEditandoId ? 'Cliente actualizado' : 'Cliente registrado', 'success');
    } else {
      const err = await res.json();
      mostrarToast(err.error || 'Error al guardar', 'error');
    }
  } catch {
    mostrarToast('Error de conexión', 'error');
  }
}
