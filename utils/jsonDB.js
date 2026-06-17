// ============================================
// utils/jsonDB.js - Persistencia en archivos JSON
// ============================================

const fs = require('fs');
const crypto = require('crypto');

function leerJSON(rutaArchivo) {
  const raw = fs.readFileSync(rutaArchivo, 'utf-8');
  return JSON.parse(raw);
}

// Escritura atómica: escribe en un archivo temporal y luego lo renombra.
// Si el proceso muere a mitad de la escritura, el archivo original
// permanece intacto. El renombrado es atómico en la mayoría de los SO.
function guardarJSON(rutaArchivo, datos) {
  const tmp = `${rutaArchivo}.${crypto.randomBytes(4).toString('hex')}.tmp`;
  try {
    fs.writeFileSync(tmp, JSON.stringify(datos, null, 2));
    fs.renameSync(tmp, rutaArchivo);
  } catch (err) {
    try { fs.unlinkSync(tmp); } catch {} // limpiar el archivo temporal si algo falla
    throw err;
  }
}

module.exports = { leerJSON, guardarJSON };
