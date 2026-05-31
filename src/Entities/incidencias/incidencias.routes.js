const { Router } = require('express');
const incidenciasController = require('./incidencias.controller');
const { verifyToken, requireMecanicoOperadorOrAdmin } = require('../../middleware/auth');

const router = Router();

// Listar incidencias (GET /api/incidencias) - solo Mecanico/Operador/Administrador
router.get('/', verifyToken, requireMecanicoOperadorOrAdmin, incidenciasController.listarIncidencias);

// Registrar una incidencia (POST /api/incidencias) - solo Mecanico/Operador/Administrador
router.post('/', verifyToken, requireMecanicoOperadorOrAdmin, incidenciasController.crearIncidencia);

module.exports = router;