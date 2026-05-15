const express = require('express');
const router = express.Router();
const roleRequestsController = require('./role_requests.controller');
const authMiddleware = require('../../middleware/auth');

// Crear una solicitud de cambio de rol (usuario autenticado)
router.post('/', authMiddleware.verifyToken, roleRequestsController.createRequest);
router.get('/', authMiddleware.verifyToken, authMiddleware.requireAdmin, roleRequestsController.listRequests);

module.exports = router;
