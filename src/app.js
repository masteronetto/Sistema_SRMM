const express = require('express');
const path = require('path');
const { hasDatabaseConfig } = require('./config/env');

const app = express();
const frontendPath = path.join(__dirname, '..', 'frontend');

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
app.use(express.static(frontendPath));

app.get(['/favicon.ico', '/favicon.png'], (_req, res) => {
  res.type('image/svg+xml');
  res.sendFile(path.join(frontendPath, 'favicon.svg'));
});

app.get('/', (_req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

if (hasDatabaseConfig) {
  const usuariosRoutes = require('./Entities/usuarios/usuarios.routes');
  const historialUsoRoutes = require('./Entities/historial_uso/historial_uso.routes');
  const maquinariaRoutes = require('./Entities/maquinaria/maquinaria.routes');
  const mantenimientosRoutes = require('./Entities/mantenimientos/mantenimientos.routes');
  const reportesRoutes = require('./Entities/reportes/reportes.routes');
  const alertasCriticasRoutes = require('./Entities/alertas_criticas/alertas_criticas.routes');
  const notificacionesTiempoRealRoutes = require('./Entities/notificaciones_tiempo_real/notificaciones_tiempo_real.routes');
  const planesMantencionRoutes = require('./Entities/planes_mantencion/planes_mantencion.routes');

  app.use('/api/usuarios', usuariosRoutes);
  app.use('/api/maquinaria', maquinariaRoutes);
  app.use('/api/mantenimientos', mantenimientosRoutes);
  app.use('/api/historial-uso', historialUsoRoutes);
  app.use('/api/reportes', reportesRoutes);
  app.use('/api/alertas-criticas', alertasCriticasRoutes);
  app.use('/api/notificaciones-tiempo-real', notificacionesTiempoRealRoutes);
  app.use('/api/planes-mantencion', planesMantencionRoutes);
} else {
  app.use('/api', (_req, res) => {
    res.status(503).json({
      message: 'La base de datos no está configurada en este entorno. El frontend sigue disponible.'
    });
  });
}

app.use((err, _req, res, _next) => {
  console.error(err);

  if (isDatabaseUnavailableError(err)) {
    return res.status(503).json({ message: 'Base de datos no disponible. Intenta nuevamente en unos minutos.' });
  }

  res.status(500).json({ message: 'Error interno del servidor' });
});

module.exports = app;
