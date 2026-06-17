import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:3000';
const API = `${API_BASE}/api/customers`;

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [name, setName]   = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');   // mensaje de error
  const [exito, setExito] = useState('');   // mensaje de éxito

  useEffect(() => {
    cargarClientes();
  }, []);

  function cargarClientes() {
    fetch(API)
      .then((res) => res.json())
      .then((data) => setCustomers(data));
  }

  function registrarCliente(e) {
    e.preventDefault();
    setError('');
    setExito('');

    // 1) Validación en el cliente (feedback rápido)
    if (name.trim() === '') {
      setError('El nombre es obligatorio');
      return;  // no enviamos nada
    }
    const emailValido = /^\S+@\S+\.\S+$/.test(email);
    if (!emailValido) {
      setError('Escribe un email válido (ej. ana@correo.com)');
      return;
    }

    // 2) Si pasa, lo mandamos al backend
    fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);  // el backend rechazó
        return data;
      })
      .then(() => {
        setExito('✅ Cliente registrado');
        setName(''); setEmail(''); setPhone('');
        cargarClientes();
      })
      .catch((err) => setError(err.message));  // mostramos el error del backend
  }

  return (
    <div style={{ maxWidth: 600, margin: '2rem auto', fontFamily: 'sans-serif' }}>
      <h2>🧑 Clientes</h2>

      <form onSubmit={registrarCliente}
            style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: '1rem' }}>
        <input placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)} />
        <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input placeholder="Teléfono (opcional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <button type="submit">Registrar cliente</button>
      </form>

      {/* Estos mensajes aparecen SOLO si hay texto */}
      {error && <p style={{ color: 'crimson' }}>⚠️ {error}</p>}
      {exito && <p style={{ color: 'green' }}>{exito}</p>}

      <ul>
        {customers.map((c) => (
          <li key={c._id}>{c.name} — {c.email} {c.phone && `— ${c.phone}`}</li>
        ))}
      </ul>
    </div>
  );
}

export default Customers;