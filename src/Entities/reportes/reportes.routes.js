const { Router } = require('express');
const controller = require('./reportes.controller');
const { verifyToken } = require('../../middleware/auth');

const router = Router();

router.get('/historial-unificado/:id_maquina', verifyToken, controller.obtenerHistorialMaquina);
router.get('/top-maquinas', verifyToken, controller.obtenerTopMaquinas);
router.get('/estadisticas', verifyToken, controller.obtenerEstadisticas);
router.get('/uso-historico/:id_maquina', verifyToken, controller.obtenerUsoHistorico);
router.get('/fallas', verifyToken, controller.obtenerReporteFallas);
router.get('/ingresos', verifyToken, controller.obtenerIngresos);
router.get('/ingresos/csv', verifyToken, controller.obtenerIngresosCsv);

module.exports = router;