const { Router } = require('express');
const controller = require('./mantenimientos.controller');

const router = Router();

// Mantenimientos completados (legacy)
router.post('/', controller.create);
router.get('/maquina/:maquinaria_id_maquina', controller.listByMaquina);

// Órdenes de trabajo (SIS-15: Programar mantenimientos preventivos)
router.post('/programar', controller.programar);
router.get('/ordenes/atrasadas', controller.listOrdenesAtrasadas);
router.post('/ordenes/verificar-retrasos', controller.verificarRetrasos);
router.get('/ordenes/maquina/:maquinaria_id_maquina', controller.listOrdenesMaquina);
router.get('/ordenes/mecanico/:mecanico_id', controller.listOrdenesMecanico);
router.patch('/ordenes/:id_orden/iniciar', controller.iniciar);

module.exports = router;
