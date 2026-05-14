const { Router } = require('express');
const controller = require('./usuarios.controller');
const { verifyToken, requireAdmin } = require('../../middleware/auth');

const router = Router();

router.get('/', controller.list);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

// Ruta protegida: solo admins pueden cambiar roles
router.put('/:id/role', verifyToken, requireAdmin, controller.changeRole);

module.exports = router;
