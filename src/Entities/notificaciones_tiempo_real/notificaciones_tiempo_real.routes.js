const {
  listNotificacionesAdmin,
  marcarNotificacionComoLeida,
  marcarTodasComoLeidas,
  deleteNotificacion,
} = require('./notificaciones_tiempo_real.controller');
const { verifyToken, requireAdmin } = require('../../middleware/auth');

const router = require('express').Router();

// Obtener todas las notificaciones del admin autenticado
router.get('/', verifyToken, requireAdmin, listNotificacionesAdmin);

// Marcar una notificación como leída
router.patch('/:id/leida', verifyToken, requireAdmin, marcarNotificacionComoLeida);

// Marcar todas las notificaciones como leídas
router.patch('/admin/leer-todas', verifyToken, requireAdmin, marcarTodasComoLeidas);

// Eliminar una notificación
router.delete('/:id', verifyToken, requireAdmin, deleteNotificacion);

module.exports = router;
