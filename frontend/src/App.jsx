import { useState, useEffect } from 'react';
import './App.css';
import Customers from './Customers';
import Checkout from './Checkout';

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:3000';
const API = `${API_BASE}/api/products`;

function App() {
  const [products, setProducts] = useState([]);
  const [name, setName]   = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [busqueda, setBusqueda] = useState('');   // 👈 NUEVO: texto del buscador

  useEffect(() => {
    cargarProductos();
  }, []);

  function cargarProductos() {
    fetch(API)
      .then((res) => res.json())
      .then((data) => setProducts(data));
  }

  function agregarProducto(e) {
    e.preventDefault();
    fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, price: Number(price), stock: Number(stock) }),
    })
      .then((res) => res.json())
      .then(() => {
        cargarProductos();
        setName(''); setPrice(''); setStock('');
      });
  }

  // 👇 NUEVO: borrar un producto por su id
  function borrarProducto(id) {
    fetch(`${API}/${id}`, { method: 'DELETE' })
      .then(() => cargarProductos());   // refresca la lista
  }

  // 👇 NUEVO: filtramos la lista según lo que se escribe en el buscador
  const productosFiltrados = products.filter((p) =>
    p.name.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div style={{ maxWidth: 600, margin: '2rem auto', fontFamily: 'sans-serif' }}>
      <h1>☕ Productos — Cafecito Feliz</h1>

       <Checkout />

      <form onSubmit={agregarProducto} style={{ marginBottom: '1rem', display: 'flex', gap: 8 }}>
        <input placeholder="Nombre" value={name}
               onChange={(e) => setName(e.target.value)} required />
        <input placeholder="Precio" type="number" value={price}
               onChange={(e) => setPrice(e.target.value)} required />
        <input placeholder="Stock" type="number" value={stock}
               onChange={(e) => setStock(e.target.value)} />
        <button type="submit">Agregar</button>
      </form>

      {/* 👇 NUEVO: el buscador */}
      <input
        placeholder="🔍 Buscar producto..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        style={{ width: '100%', marginBottom: '1rem', padding: 6 }}
      />

      <ul>
        {productosFiltrados.map((p) => (
          <li key={p._id} style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>{p.name} — ${p.price} (stock: {p.stock})</span>
            <button onClick={() => borrarProducto(p._id)}>🗑️</button>
          </li>
        ))}
      </ul>
      <Customers />
    </div>
  );
}

export default App;