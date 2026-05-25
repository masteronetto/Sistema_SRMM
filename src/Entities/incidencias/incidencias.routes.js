const { Router } = require('express');
const incidenciasController = require('./incidencias.controller');

const router = Router();

// Registrar una incidencia (POST /api/incidencias)
router.post('/', incidenciasController.crearIncidencia);

module.exports = router;