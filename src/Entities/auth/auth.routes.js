const { Router } = require('express');
const controller = require('./auth.controller');

const router = Router();

router.post('/login', controller.login);
router.post('/register', controller.register);
router.post('/recover', controller.recover);
router.post('/reset', controller.resetPassword);

module.exports = router;
