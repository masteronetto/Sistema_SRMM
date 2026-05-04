const http = require('http');
const app = require('./app');
const mantenimientosController = require('./Entities/mantenimientos/mantenimientos.controller');
const { setupSocketIO } = require('./config/socketio');
const { port } = require('./config/env');

// Crear servidor HTTP para soportar WebSocket
const httpServer = http.createServer(app);

// Configurar Socket.IO
const io = setupSocketIO(httpServer);

// Hacer io accesible en la app
app.set('io', io);

const intervaloVerificacionRetrasos = Number(process.env.RETRASOS_CHECK_INTERVAL_MS || 60000);

async function ejecutarChequeoRetrasos() {
  try {
    await mantenimientosController.procesarRetrasos(io);
  } catch (error) {
    console.error('[Scheduler] Error verificando retrasos de mantenimiento:', error);
  }
}

ejecutarChequeoRetrasos();
setInterval(ejecutarChequeoRetrasos, intervaloVerificacionRetrasos);

httpServer.listen(port, () => {
  console.log(`SRMM API escuchando en puerto ${port}`);
  console.log(`WebSocket (Socket.IO) disponible en puerto ${port}`);
  console.log(`Chequeo automático de retrasos cada ${intervaloVerificacionRetrasos} ms`);
});
