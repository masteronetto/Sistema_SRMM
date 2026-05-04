const express = require('express');
const path = require('path');
const { hasDatabaseConfig } = require('./config/env');

const app = express();
const publicPath = path.join(__dirname, '..', 'public');

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
app.use(express.static(publicPath));

// Permitir bots de preview y captura de Vercel
app.use((_req, res, next) => {
  res.set('X-Robots-Tag', 'noindex, nofollow');
  next();
});

app.get(['/favicon.ico', '/favicon.png'], (_req, res) => {
  res.type('image/svg+xml');
  res.sendFile(path.join(publicPath, 'favicon.svg'));
});

app.get('/', (_req, res) => {
  const protocol = _req.protocol;
  const host = _req.get('host');
  const absoluteUrl = `${protocol}://${host}`;
  
  // Leer y servir el HTML con URLs absolutas para OpenGraph
  const fs = require('fs');
  let htmlContent = fs.readFileSync(path.join(publicPath, 'index.html'), 'utf-8');
  
  // Reemplazar rutas relativas de og:image y twitter:image con URLs absolutas
  htmlContent = htmlContent
    .replace('content="/og-image.svg"', `content="${absoluteUrl}/og-image.svg"`)
    .replace('content="/og-image.svg"', `content="${absoluteUrl}/og-image.svg"`);
  
  res.type('text/html').send(htmlContent);
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/robots.txt', (_req, res) => {
  res.type('text/plain');
  res.sendFile(path.join(publicPath, 'robots.txt'));
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

// Fallback: cualquier ruta no encontrada que no sea API, servir index.html
app.use((_req, res) => {
  if (!_req.path.startsWith('/api')) {
    return res.status(200).sendFile(path.join(publicPath, 'index.html'));
  }
  res.status(404).json({ message: 'Not found' });
});

module.exports = app;
