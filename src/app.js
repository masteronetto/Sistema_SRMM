const express = require('express');
const usuariosRoutes = require('./modules/usuarios/usuarios.routes');
const mantenedoresRoutes = require('./modules/mantenedores/mantenedores.routes');

const app = express();

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/usuarios', usuariosRoutes);
app.use('/api/mantenedores', mantenedoresRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'Error interno del servidor' });
});

module.exports = app;
