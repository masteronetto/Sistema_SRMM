const reportesRepo = require('./reportes.repository');

async function obtenerHistorialMaquina(req, res, next) {
  try {
    const id_maquina = Number(req.params.id_maquina);
    const { fecha_inicio, fecha_fin } = req.query;

    if (!id_maquina || isNaN(id_maquina)) {
      return res.status(400).json({ message: 'id_maquina inválido' });
    }

    const data = await reportesRepo.getHistorialUnificado(id_maquina, fecha_inicio, fecha_fin);
    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

async function obtenerTopMaquinas(req, res, next) {
  try {
    const data = await reportesRepo.getTopMaquinas();
    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

async function obtenerEstadisticas(req, res, next) {
  try {
    const data = await reportesRepo.getEstadisticas();
    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

async function obtenerUsoHistorico(req, res, next) {
  try {
    const id_maquina = Number(req.params.id_maquina);
    if (!id_maquina || isNaN(id_maquina)) {
      return res.status(400).json({ message: 'id_maquina inválido' });
    }
    const data = await reportesRepo.getUsoHistorico(id_maquina);
    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

async function obtenerIngresos(req, res, next) {
  try {
    const { fecha_inicio, fecha_fin, tarifa } = req.query;
    const tarifa_diaria = tarifa ? Number(tarifa) : (process.env.ARRIENDO_RATE_DIA ? Number(process.env.ARRIENDO_RATE_DIA) : 100000);

    const data = await reportesRepo.getIngresosPorArriendos(fecha_inicio, fecha_fin, tarifa_diaria);
    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

async function obtenerIngresosCsv(req, res, next) {
  try {
    const { fecha_inicio, fecha_fin, tarifa } = req.query;
    const tarifa_diaria = tarifa ? Number(tarifa) : (process.env.ARRIENDO_RATE_DIA ? Number(process.env.ARRIENDO_RATE_DIA) : 100000);

    const data = await reportesRepo.getIngresosPorArriendos(fecha_inicio, fecha_fin, tarifa_diaria);

    // Build CSV
    const headers = ['id_maquina', 'modelo_equipo', 'contratos', 'dias_arrendados', 'tarifa_usada', 'ingresos'];
    const lines = [headers.join(',')];
    data.by_maquina.forEach(row => {
      const line = [
        row.id_maquina,
        '"' + String(row.modelo_equipo || '').replace(/"/g, '""') + '"',
        row.contratos,
        row.dias_arrendados,
        row.tarifa_usada,
        row.ingresos
      ].join(',');
      lines.push(line);
    });

    const csv = lines.join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="ingresos_arriendos_${fecha_inicio || 'from'}_${fecha_fin || 'to'}.csv"`);
    return res.send(csv);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  obtenerHistorialMaquina,
  obtenerTopMaquinas,
  obtenerEstadisticas,
  obtenerUsoHistorico
  , obtenerIngresos
  , obtenerIngresosCsv
};