const http = require('http');
const app = require('./app');
const { setupSocketIO } = require('./config/socketio');
const { port, hasDatabaseConfig } = require('./config/env');

// Crear servidor HTTP para soportar WebSocket
const httpServer = http.createServer(app);

// Configurar Socket.IO
const io = setupSocketIO(httpServer);

// Hacer io accesible en la app
app.set('io', io);

const pool = require('./db/pool'); 

async function ejecutarChequeoRetrasos() {
  if (!hasDatabaseConfig) {
    return;
  }

  try {
    const mantenimientosController = require('./Entities/mantenimientos/mantenimientos.controller');
    await mantenimientosController.procesarRetrasos(io);
  } catch (error) {
    console.error('[Scheduler] Error verificando retrasos de mantenimiento:', error);
  }
} 

async function verificarFaltasDeRegistro() {
  console.log('[Scheduler] Buscando máquinas sin registro de horómetro en las últimas 24 hrs...');
  try {
    const query = `
      SELECT m.id_maquina, m.modelo_equipo, 
             COALESCE(MAX(h.fecha_registro), m.created_at::date) as ultima_fecha
      FROM maquinaria m
      LEFT JOIN historial_horometro h ON m.id_maquina = h.maquinaria_id_maquina
      WHERE m.estado NOT IN ('Mantencion', 'Bloqueada', 'No Operativa')
      GROUP BY m.id_maquina, m.modelo_equipo, m.created_at
      HAVING COALESCE(MAX(h.fecha_registro), m.created_at::date) < CURRENT_DATE - INTERVAL '1 day'
    `;
    
    const { rows } = await pool.query(query);

    for (const maq of rows) {
      await pool.query(`
        INSERT INTO alertas_criticas (maquinaria_id_maquina, tipo_alerta, estado_alerta, porcentaje_umbral, horometro_critico, requiere_mantenimiento)
        VALUES ($1, 'Advertencia', 'Pendiente', 0, 0, FALSE)
      `, [maq.id_maquina]);
      
      console.log(`[ALERTA INTERNA] Máquina ID: ${maq.id_maquina} (${maq.modelo_equipo}) sin registro de horómetro desde ${maq.ultima_fecha}. Operador será notificado.`);
      
      if (typeof io !== 'undefined') {
        io.emit('alerta:nueva', {
          tipo: 'Advertencia',
          mensaje: `La máquina ${maq.modelo_equipo} lleva más de 24 hrs sin registro.`
        });
      }
    }
  } catch (error) {
    console.error('[Scheduler] Error al verificar registros:', error);
  }
}

if (hasDatabaseConfig) {
  setInterval(verificarFaltasDeRegistro, 86400000);
}

if (hasDatabaseConfig) {
  ejecutarChequeoRetrasos();
  setInterval(ejecutarChequeoRetrasos, intervaloVerificacionRetrasos);
} else {
  console.log('Modo frontend activo: la API y el scheduler de BD están deshabilitados hasta configurar PostgreSQL.');
}

httpServer.listen(port, () => {
  console.log(`SRMM API escuchando en puerto ${port}`);
  console.log(`WebSocket (Socket.IO) disponible en puerto ${port}`);
  console.log(`Chequeo automático de retrasos cada ${intervaloVerificacionRetrasos} ms`);
});
