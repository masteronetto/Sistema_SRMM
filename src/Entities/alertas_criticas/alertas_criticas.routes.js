const { Router } = require('express');
const controller = require('./alertas_criticas.controller');

const router = Router();

// Obtener alertas pendientes de una maquina específica
router.get('/:id_maquina/pendientes', controller.getAlertasPendientes);

// Obtener todas las alertas con paginación
router.get('/', controller.getAllertas);

// Descartar una alerta
router.patch('/:id_alerta/descartar', controller.descartar);

// Resolver alerta tras completar mantenimiento
router.patch('/:id_alerta/resolver', controller.resolverAlerta);

module.exports = router;
