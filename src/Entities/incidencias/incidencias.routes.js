const { Router } = require('express');
const incidenciasController = require('./incidencias.controller');
const { verifyToken, requireMecanicoOperadorOrAdmin, requireMecanicoOrAdmin, requireActiveUser } = require('../../middleware/auth');

const router = Router();

router.use((req, res, next) => {
  // Solo validar usuario activo si está autenticado
  if (req.headers.authorization) {
    return requireActiveUser(req, res, next);
  }
  next();
});

// Listar incidencias (GET /api/incidencias) - solo Mecanico/Operador/Administrador
router.get('/', verifyToken, requireMecanicoOperadorOrAdmin, incidenciasController.listarIncidencias);

// Registrar una incidencia (POST /api/incidencias) - solo Mecanico/Operador/Administrador
router.post('/', verifyToken, requireMecanicoOperadorOrAdmin, incidenciasController.crearIncidencia);

// Resolver una incidencia (PATCH /api/incidencias/:id_incidencia/resolver) - solo Mecanico/Administrador
router.patch('/:id_incidencia/resolver', verifyToken, requireMecanicoOrAdmin, incidenciasController.resolverIncidencia);

module.exports = router;