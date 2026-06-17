require('dotenv').config();        // carga las variables del .env
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const productRoutes = require('./routes/Products');
const customerRoutes = require('./routes/Customers');  // arriba con los require
const saleRoutes = require('./routes/Sales'); 



const app = express();
app.use(cors());                   // permite peticiones desde React
app.use(express.json());           // entiende datos en formato JSON

// Conexión a MongoDB Atlas
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Conectado a MongoDB'))
  .catch((err) => console.error('❌ Error al conectar:', err.message));

// Ruta de prueba: cuando alguien visita "/", responde un saludo
app.get('/', (req, res) => {
  res.json({ mensaje: '¡El backend de Cafecito Feliz está vivo! ☕' });
});

// Enciende el servidor
const PORT = process.env.PORT || 3000;
app.use('/api/products', productRoutes);
app.use('/api/customers', customerRoutes);  // antes de app.listen
app.use('/api/sales', saleRoutes); 
app.listen(PORT, () => console.log(`🚀 Servidor en http://localhost:${PORT}`));