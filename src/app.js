const express = require('express');
const usuariosRoutes = require('./Entities/usuarios/usuarios.routes');
const historialUsoRoutes = require('./Entities/historial_uso/historial_uso.routes');
const maquinariaRoutes = require('./Entities/maquinaria/maquinaria.routes');
const mantenimientosRoutes = require('./Entities/mantenimientos/mantenimientos.routes');

const app = express();

function isDatabaseUnavailableError(error) {
  if (!error) {
    return false;
  }

  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
    return true;
  }

  if (Array.isArray(error.errors)) {
    return error.errors.some((dbError) => (
      dbError && (dbError.code === 'ECONNREFUSED' || dbError.code === 'ENOTFOUND' || dbError.code === 'ETIMEDOUT')
    ));
  }

  return false;
}

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/usuarios', usuariosRoutes);
app.use('/api/maquinaria', maquinariaRoutes);
app.use('/api/mantenimientos', mantenimientosRoutes);
app.use('/api/historial-uso', historialUsoRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);

  if (isDatabaseUnavailableError(err)) {
    return res.status(503).json({ message: 'Base de datos no disponible. Intenta nuevamente en unos minutos.' });
  }

  res.status(500).json({ message: 'Error interno del servidor' });
});

module.exports = app;
