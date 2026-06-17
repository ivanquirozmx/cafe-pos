# ☕ Café POS

Sistema de Punto de Venta para cafetería. Desarrollado con Node.js, Express y Vanilla JavaScript.

## Características

- **🧾 Punto de venta** — Agrega productos al pedido, aplica descuentos a clientes frecuentes y registra la venta con método de pago
- **📊 Historial de ventas** — Consulta ventas por rango de fechas con resumen diario y total del período
- **📦 Gestión de productos** — Agrega nuevos productos y activa/desactiva disponibilidad en tiempo real
- **👤 Clientes frecuentes** — Registra clientes y configura su porcentaje de descuento individual

## Tecnologías

| Capa | Tecnología |
|------|-----------|
| Backend | Node.js + Express 4 |
| Frontend | HTML5 + CSS3 + Vanilla JS (ES6+) |
| Persistencia | Archivos JSON (sin base de datos externa) |
| Dev | Nodemon |

## Requisitos

- [Node.js](https://nodejs.org/) v18 o superior
- npm (incluido con Node.js)

## Instalación y uso

```bash
# 1. Clonar o descargar el proyecto
git clone <url-del-repo>
cd cafe-pos

# 2. Instalar dependencias
npm install

# 3. Iniciar el servidor
npm start          # producción
npm run dev        # desarrollo (con recarga automática)

# 4. Abrir en el navegador
# http://localhost:3000
```

## Estructura del proyecto

```
cafe-pos/
├── server.js              # Punto de entrada del servidor
├── package.json
├── .env.example           # Plantilla de variables de entorno
├── routes/
│   ├── productos.js       # GET/POST/PATCH productos del menú
│   ├── ordenes.js         # Gestión de la orden activa
│   ├── ventas.js          # Historial y filtrado de ventas
│   └── clientes.js        # CRUD de clientes frecuentes
├── data/
│   ├── productos.json     # Menú del café
│   ├── clientes.json      # Base de datos de clientes
│   ├── ventas.json        # Historial de ventas
│   └── orden-activa.json  # Estado persistido de la orden actual
└── public/
    ├── index.html         # Interfaz de usuario
    ├── app.js             # Lógica del frontend
    └── style.css          # Estilos
```

## API Reference

### Productos
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/productos` | Todos los productos |
| `GET` | `/api/productos/disponibles` | Solo productos disponibles |
| `POST` | `/api/productos` | Crear producto `{ nombre, categoria, precio }` |
| `PATCH` | `/api/productos/:id/disponibilidad` | Activar/desactivar producto |

### Orden activa
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/ordenes/actual` | Ver orden con totales y descuento |
| `POST` | `/api/ordenes/agregar` | Agregar producto `{ productoId }` |
| `DELETE` | `/api/ordenes/quitar/:productoId` | Quitar producto |
| `POST` | `/api/ordenes/cliente` | Asignar cliente `{ clienteId }` |
| `DELETE` | `/api/ordenes/cliente` | Remover cliente de la orden |
| `POST` | `/api/ordenes/cobrar` | Finalizar venta `{ metodoPago }` |
| `DELETE` | `/api/ordenes/cancelar` | Cancelar orden |

### Ventas
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/ventas` | Todas las ventas (más reciente primero) |
| `GET` | `/api/ventas/hoy` | Ventas del día actual |
| `GET` | `/api/ventas/filtrar?desde=YYYY-MM-DD&hasta=YYYY-MM-DD` | Ventas por rango de fechas |
| `GET` | `/api/ventas/resumen` | Resumen general (total, más vendido) |

### Clientes
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/clientes` | Todos los clientes |
| `GET` | `/api/clientes/buscar?nombre=X` | Buscar cliente por nombre |
| `POST` | `/api/clientes` | Registrar cliente `{ nombre, telefono?, notas? }` |
| `PATCH` | `/api/clientes/:id/descuento` | Actualizar descuento `{ descuento }` |

## Notas de desarrollo

- La persistencia usa archivos `.json` en `/data`. Para producción real se recomendaría SQLite o MongoDB.
- La orden activa se guarda en `data/orden-activa.json` — **sobrevive reinicios del servidor**.
- Los IDs se generan con `Date.now()` para evitar colisiones al eliminar registros.

## Autor

Ivan Quiroz — Proyecto de curso Desarrollo Fullstack
