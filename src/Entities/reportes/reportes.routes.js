const { Router } = require('express');
const controller = require('./reportes.controller');
const { verifyToken, requireMecanicoOrAdmin, requireMecanicoOperadorOrAdmin, requireAdmin, requireActiveUser } = require('../../middleware/auth');

const router = Router();

router.use((req, res, next) => {
  // Solo validar usuario activo si está autenticado
  if (req.headers.authorization) {
    return requireActiveUser(req, res, next);
  }
  next();
});

router.get('/historial-unificado/:id_maquina', verifyToken, controller.obtenerHistorialMaquina);
router.get('/top-maquinas', verifyToken, controller.obtenerTopMaquinas);
router.get('/estadisticas', verifyToken, controller.obtenerEstadisticas);
router.get('/uso-historico/:id_maquina', verifyToken, controller.obtenerUsoHistorico);
router.get('/operador/resumen', verifyToken, requireMecanicoOperadorOrAdmin, controller.obtenerResumenOperador);
router.get('/autores', verifyToken, requireMecanicoOrAdmin, controller.obtenerActividadPorAutor);
router.get('/fallas/propias', verifyToken, requireMecanicoOperadorOrAdmin, controller.obtenerReporteFallasPropias);
router.get('/fallas', verifyToken, requireMecanicoOrAdmin, controller.obtenerReporteFallas);
router.get('/mantenimientos', verifyToken, requireMecanicoOrAdmin, controller.obtenerReporteMantenimientos);
router.get('/ingresos', verifyToken, requireAdmin, controller.obtenerIngresos);
router.get('/ingresos/csv', verifyToken, requireAdmin, controller.obtenerIngresosCsv);

module.exports = router;