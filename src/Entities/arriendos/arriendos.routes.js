const { Router } = require('express');
const controller = require('./arriendos.controller');

const router = Router();

router.post('/', controller.createContrato);

module.exports = router;