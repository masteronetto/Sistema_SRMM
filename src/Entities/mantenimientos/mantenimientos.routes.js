const { Router } = require('express');
const controller = require('./mantenimientos.controller');

const router = Router();

router.post('/', controller.create);
router.get('/maquina/:maquinaria_id_maquina', controller.listByMaquina);

module.exports = router;
