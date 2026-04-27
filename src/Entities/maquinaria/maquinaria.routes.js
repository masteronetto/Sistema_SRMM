const { Router } = require('express');
const controller = require('./maquinaria.controller');

const router = Router();

router.get('/', controller.list);
router.get('/:id_maquina', controller.getById);
router.post('/', controller.create);
router.put('/:id_maquina', controller.update);
router.patch('/:id_maquina/mark-not-operative', controller.markAsNotOperative);
router.delete('/:id_maquina', controller.remove);

module.exports = router;
