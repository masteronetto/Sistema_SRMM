const { Router } = require('express');
const controller = require('./reportes.controller');

const router = Router();

router.get('/historial-unificado/:id_maquina', controller.obtenerHistorialMaquina);

module.exports = router;