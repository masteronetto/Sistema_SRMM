const reportesRepo = require('./reportes.repository');

async function obtenerHistorialMaquina(req, res, next) {
  try {
    const id_maquina = Number(req.params.id_maquina);
    const { fecha_inicio, fecha_fin } = req.query; // Capturamos filtros de fecha desde la URL

    if (!id_maquina || isNaN(id_maquina)) {
      return res.status(400).json({ message: 'id_maquina inválido' });
    }

    const data = await reportesRepo.getHistorialUnificado(id_maquina, fecha_inicio, fecha_fin);
    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  obtenerHistorialMaquina
};