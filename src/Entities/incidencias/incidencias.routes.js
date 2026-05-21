const incidenciasController = require('./controllers/incidencias.controller');

router.post('/incidencias', incidenciasController.crearIncidencia);