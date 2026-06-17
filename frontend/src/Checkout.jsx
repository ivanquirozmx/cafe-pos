import { useState, useEffect } from 'react';

const API_BASE      = import.meta.env.VITE_API_BASE ?? 'http://localhost:3000';
const API_PRODUCTS  = `${API_BASE}/api/products`;
const API_CUSTOMERS = `${API_BASE}/api/customers`;
const API_SALES     = `${API_BASE}/api/sales`;

function Checkout() {
  const [products, setProducts]     = useState([]);
  const [customers, setCustomers]   = useState([]);
  const [cart, setCart]             = useState([]);   // el carrito
  const [customerId, setCustomerId] = useState('');
  const [discount, setDiscount]     = useState(0);
  const [ticket, setTicket]         = useState(null); // el ticket tras cobrar
  const [error, setError]           = useState('');

  useEffect(() => {
    cargarProductos();
    cargarClientes();
  }, []);

  function cargarProductos() {
    fetch(API_PRODUCTS).then((r) => r.json()).then(setProducts);
  }
  function cargarClientes() {
    fetch(API_CUSTOMERS).then((r) => r.json()).then(setCustomers);
  }

  // Agregar al carrito (o sumar 1 si ya estaba)
  function agregarAlCarrito(product) {
    setCart((prev) => {
      const existe = prev.find((item) => item.productId === product._id);
      if (existe) {
        return prev.map((item) =>
          item.productId === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, {
        productId: product._id, name: product.name,
        price: product.price, quantity: 1,
      }];
    });
  }

  function quitarDelCarrito(productId) {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  }

  // Total en vivo: se recalcula solo en cada cambio
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal - (subtotal * discount / 100);

  // Cobrar: mandamos la venta al backend
  function cobrar() {
    setError('');
    if (cart.length === 0) {
      setError('El carrito está vacío');
      return;
    }
    fetch(API_SALES, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: cart.map((item) => ({ productId: item.productId, quantity: item.quantity })),
        customer: customerId || undefined,
        discount: Number(discount),
      }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        return data;
      })
      .then((venta) => {
        setTicket(venta);   // mostrar el ticket
        setCart([]);        // vaciar carrito
        setDiscount(0);
        setCustomerId('');
        cargarProductos();  // refrescar stock
      })
      .catch((err) => setError(err.message));
  }

  return (
    <div style={{ maxWidth: 600, margin: '2rem auto', fontFamily: 'sans-serif' }}>
      <h2>🛒 Punto de Venta</h2>

      <h3>Productos</h3>
      <ul>
        {products.map((p) => (
          <li key={p._id} style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>{p.name} — ${p.price} (stock: {p.stock})</span>
            <button onClick={() => agregarAlCarrito(p)} disabled={p.stock === 0}>
              Agregar
            </button>
          </li>
        ))}
      </ul>

      <h3>Carrito</h3>
      {cart.length === 0 ? (
        <p>Vacío</p>
      ) : (
        <ul>
          {cart.map((item) => (
            <li key={item.productId} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{item.name} x {item.quantity} = ${item.price * item.quantity}</span>
              <button onClick={() => quitarDelCarrito(item.productId)}>Quitar</button>
            </li>
          ))}
        </ul>
      )}

      <div style={{ margin: '1rem 0' }}>
        <label>
          Cliente:{' '}
          <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
            <option value="">Sin cliente</option>
            {customers.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </label>
        {'  '}
        <label>
          Descuento %:{' '}
          <input type="number" value={discount}
                 onChange={(e) => setDiscount(e.target.value)} style={{ width: 60 }} />
        </label>
      </div>

      <h3>Total: ${total.toFixed(2)}</h3>
      {error && <p style={{ color: 'crimson' }}>⚠️ {error}</p>}
      <button onClick={cobrar} style={{ padding: '8px 16px', fontSize: 16 }}>
        Cobrar
      </button>

      {ticket && (
        <div style={{ marginTop: '2rem', border: '1px dashed #999', padding: 16 }}>
          <h3>🧾 Ticket</h3>
          <ul>
            {ticket.items.map((item, i) => (
              <li key={i}>{item.name} x {item.quantity} = ${item.price * item.quantity}</li>
            ))}
          </ul>
          <p>Subtotal: ${ticket.subtotal}</p>
          <p>Descuento: {ticket.discount}%</p>
          <p><strong>Total: ${ticket.total.toFixed(2)}</strong></p>
        </div>
      )}
    </div>
  );
}

export default Checkout;