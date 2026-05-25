const { Router } = require('express');
const controller = require('./historial_uso.controller');

const router = Router();

router.post('/', controller.create);
router.post('/diario', controller.create);
router.get('/maquina/:maquinaria_id_maquina', controller.listByMaquina);
router.get('/search', controller.search);

module.exports = router;
