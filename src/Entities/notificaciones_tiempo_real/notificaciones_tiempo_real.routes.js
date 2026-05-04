const {
  listNotificacionesAdmin,
  marcarNotificacionComoLeida,
  marcarTodasComoLeidas,
  deleteNotificacion,
} = require('./notificaciones_tiempo_real.controller');

const router = require('express').Router();

// Obtener todas las notificaciones del admin autenticado
router.get('/', listNotificacionesAdmin);

// Marcar una notificación como leída
router.patch('/:id/leida', marcarNotificacionComoLeida);

// Marcar todas las notificaciones como leídas
router.patch('/admin/leer-todas', marcarTodasComoLeidas);

// Eliminar una notificación
router.delete('/:id', deleteNotificacion);

module.exports = router;
