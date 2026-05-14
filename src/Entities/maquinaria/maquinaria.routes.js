const { Router } = require('express');
const controller = require('./maquinaria.controller');

const router = Router();

router.get('/', controller.list);
router.get('/urgent-maintenance', controller.listUrgentMaintenance);
router.get('/:id_maquina', controller.getById);
router.get('/:id_maquina/horas-acumuladas', controller.getHorasAcumuladas);
router.get('/:id_maquina/disponibilidad', controller.getDisponibilidad);
router.get('/:id_maquina/bloqueo', controller.getBloqueo);
router.post('/', controller.create);
router.post('/:id_maquina/bloqueo-critico', controller.blockCritical);
router.put('/:id_maquina', controller.update);
router.patch('/:id_maquina/mark-not-operative', controller.markAsNotOperative);
router.patch('/:id_maquina/desbloquear', controller.unblock);
router.delete('/:id_maquina', controller.remove);

module.exports = router;
