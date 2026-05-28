const { Router } = require('express');
const controller = require('./logistica.controller');
const { verifyToken, requireAdmin } = require('../../middleware/auth');

const router = Router();

router.use(verifyToken);

router.get('/', controller.list);
router.post('/', requireAdmin, controller.create);
router.delete('/:id_evento', requireAdmin, controller.remove);

module.exports = router;