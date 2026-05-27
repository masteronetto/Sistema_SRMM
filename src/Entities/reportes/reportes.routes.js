const { Router } = require('express');
const controller = require('./reportes.controller');
const { verifyToken, requireAdmin } = require('../../middleware/auth');

const router = Router();

router.get('/historial-unificado/:id_maquina', verifyToken, requireAdmin, controller.obtenerHistorialMaquina);
router.get('/top-maquinas', verifyToken, requireAdmin, controller.obtenerTopMaquinas);
router.get('/estadisticas', verifyToken, requireAdmin, controller.obtenerEstadisticas);
router.get('/uso-historico/:id_maquina', verifyToken, requireAdmin, controller.obtenerUsoHistorico);
router.get('/fallas', verifyToken, requireAdmin, controller.obtenerReporteFallas);
router.get('/ingresos', verifyToken, requireAdmin, controller.obtenerIngresos);
router.get('/ingresos/csv', verifyToken, requireAdmin, controller.obtenerIngresosCsv);

module.exports = router;