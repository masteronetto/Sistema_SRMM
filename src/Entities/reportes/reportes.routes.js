const { Router } = require('express');
const controller = require('./reportes.controller');

const router = Router();

router.get('/historial-unificado/:id_maquina', controller.obtenerHistorialMaquina);
router.get('/top-maquinas', controller.obtenerTopMaquinas);
router.get('/estadisticas', controller.obtenerEstadisticas);
router.get('/uso-historico/:id_maquina', controller.obtenerUsoHistorico);
router.get('/ingresos', controller.obtenerIngresos);
router.get('/ingresos/csv', controller.obtenerIngresosCsv);

module.exports = router;