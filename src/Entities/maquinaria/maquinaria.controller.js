const maquinariaRepo = require('./maquinaria.repository');

const estadosPermitidos = new Set(['Disponible', 'Arrendada', 'Mantencion', 'Bloqueada']);

function toNumberOrNull(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

function validatePayload(payload) {
  const { modelo_equipo } = payload;
  const horometro_actual = toNumberOrNull(payload.horometro_actual);
  const estado = payload.estado || 'Disponible';

  if (!modelo_equipo || horometro_actual === null) {
    return {
      error: 'Campos obligatorios: modelo_equipo, horometro_actual',
      parsed: null
    };
  }

  if (!estadosPermitidos.has(estado)) {
    return {
      error: 'estado invalido. Valores permitidos: Disponible, Arrendada, Mantencion, Bloqueada',
      parsed: null
    };
  }

  const planes_mantencion_id_plan = toNumberOrNull(payload.planes_mantencion_id_plan);
  if (payload.planes_mantencion_id_plan !== undefined && payload.planes_mantencion_id_plan !== null && planes_mantencion_id_plan === null) {
    return {
      error: 'planes_mantencion_id_plan debe ser numerico si se envia',
      parsed: null
    };
  }

  return {
    error: null,
    parsed: {
      modelo_equipo,
      horometro_actual,
      estado,
      especificaciones: payload.especificaciones || null,
      planes_mantencion_id_plan
    }
  };
}

async function list(req, res, next) {
  try {
    const data = await maquinariaRepo.listMaquinaria();
    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

async function getById(req, res, next) {
  try {
    const id_maquina = toNumberOrNull(req.params.id_maquina);
    if (id_maquina === null) {
      return res.status(400).json({ message: 'id_maquina debe ser numerico y mayor o igual a 0' });
    }

    const data = await maquinariaRepo.getMaquinariaById(id_maquina);
    if (!data) {
      return res.status(404).json({ message: 'Maquinaria no encontrada' });
    }

    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

async function getHorasAcumuladas(req, res, next) {
  try {
    const id_maquina = toNumberOrNull(req.params.id_maquina);
    if (id_maquina === null) {
      return res.status(400).json({ message: 'id_maquina debe ser numerico y mayor o igual a 0' });
    }

    const data = await maquinariaRepo.getHorasAcumuladasByMaquina(id_maquina);
    if (!data) {
      return res.status(404).json({ message: 'Maquinaria no encontrada' });
    }

    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

async function listUrgentMaintenance(req, res, next) {
  try {
    const umbralRaw = req.query.umbral;
    const limitRaw = req.query.limit;
    const offsetRaw = req.query.offset;

    const umbral = umbralRaw === undefined || umbralRaw === null || umbralRaw === '' ? 0 : Number(umbralRaw);
    const limit = limitRaw === undefined || limitRaw === null || limitRaw === '' ? null : Number(limitRaw);
    const offset = offsetRaw === undefined || offsetRaw === null || offsetRaw === '' ? null : Number(offsetRaw);

    if (Number.isNaN(umbral) || (limit !== null && Number.isNaN(limit)) || (offset !== null && Number.isNaN(offset))) {
      return res.status(400).json({ message: 'Parámetros de query inválidos: umbral, limit, offset deben ser numéricos' });
    }

    const data = await maquinariaRepo.listMaquinasConMantenimientoUrgente(Number(umbral || 0), limit, offset);
    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

async function create(req, res, next) {
  try {
    const { error, parsed } = validatePayload(req.body);
    if (error) {
      return res.status(400).json({ message: error });
    }

    const data = await maquinariaRepo.createMaquinaria(parsed);
    return res.status(201).json(data);
  } catch (error) {
    return next(error);
  }
}

async function update(req, res, next) {
  try {
    const id_maquina = toNumberOrNull(req.params.id_maquina);
    if (id_maquina === null) {
      return res.status(400).json({ message: 'id_maquina debe ser numerico y mayor o igual a 0' });
    }

    const { error, parsed } = validatePayload(req.body);
    if (error) {
      return res.status(400).json({ message: error });
    }

    const data = await maquinariaRepo.updateMaquinaria(id_maquina, parsed);
    if (!data) {
      return res.status(404).json({ message: 'Maquinaria no encontrada' });
    }

    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

async function markAsNotOperative(req, res, next) {
  try {
    const id = toNumberOrNull(req.params.id_maquina);
    if (id === null) {
      return res.status(400).json({ message: 'id_maquina debe ser numerico' });
    }

    const maq = await maquinariaRepo.getMaquinariaById(id);
    if (!maq) {
      return res.status(404).json({ message: 'Maquinaria no encontrada' });
    }

    const updated = await maquinariaRepo.updateMaquinaria(id, {
      modelo_equipo: maq.modelo_equipo,
      horometro_actual: maq.horometro_actual,
      estado: 'Bloqueada',
      especificaciones: maq.especificaciones,
      planes_mantencion_id_plan: maq.planes_mantencion_id_plan
    });

    return res.json(updated);
  } catch (error) {
    return next(error);
  }
}

async function remove(req, res, next) {
  try {
    const id_maquina = toNumberOrNull(req.params.id_maquina);
    if (id_maquina === null) {
      return res.status(400).json({ message: 'id_maquina debe ser numerico y mayor o igual a 0' });
    }

    const deleted = await maquinariaRepo.deleteMaquinaria(id_maquina);
    if (!deleted) {
      return res.status(404).json({ message: 'Maquinaria no encontrada' });
    }

    return res.status(204).send();
  } catch (error) {
    if (error.code === '23503') {
      return res.status(409).json({
        message: 'No se puede eliminar la maquinaria porque tiene registros asociados (historial o mantenimientos).'
      });
    }
    return next(error);
  }
}

async function blockCritical(req, res, next) {
  try {
    const id_maquina = toNumberOrNull(req.params.id_maquina);
    if (id_maquina === null) {
      return res.status(400).json({ message: 'id_maquina debe ser numerico' });
    }

    const { motivo_bloqueo, costo_estimado_reparacion } = req.body;
    if (!motivo_bloqueo || typeof motivo_bloqueo !== 'string' || motivo_bloqueo.trim() === '') {
      return res.status(400).json({ message: 'motivo_bloqueo es obligatorio y debe ser texto' });
    }

    const costo = costo_estimado_reparacion !== undefined 
      ? toNumberOrNull(costo_estimado_reparacion) 
      : 0;

    if (costo === null || costo < 0) {
      return res.status(400).json({ message: 'costo_estimado_reparacion debe ser numerico y no negativo' });
    }

    const bloqueo = await maquinariaRepo.blockMaquinariaWithReason(id_maquina, motivo_bloqueo.trim(), costo);
    return res.status(201).json({
      message: 'Máquina bloqueada crítica registrada',
      bloqueo
    });
  } catch (error) {
    if (error.message === 'Maquinaria no encontrada') {
      return res.status(404).json({ message: error.message });
    }
    return next(error);
  }
}

async function getBloqueo(req, res, next) {
  try {
    const id_maquina = toNumberOrNull(req.params.id_maquina);
    if (id_maquina === null) {
      return res.status(400).json({ message: 'id_maquina debe ser numerico' });
    }

    const bloqueo = await maquinariaRepo.getBloqueoMaquinaria(id_maquina);
    if (!bloqueo) {
      return res.status(404).json({ message: 'Máquina no tiene bloqueos activos' });
    }

    return res.json(bloqueo);
  } catch (error) {
    return next(error);
  }
}

async function unblock(req, res, next) {
  try {
    const id_maquina = toNumberOrNull(req.params.id_maquina);
    if (id_maquina === null) {
      return res.status(400).json({ message: 'id_maquina debe ser numerico' });
    }

    const result = await maquinariaRepo.unblockMaquinaria(id_maquina);
    return res.json({
      message: 'Máquina desbloqueada exitosamente',
      ...result
    });
  } catch (error) {
    if (error.message === 'Maquinaria no encontrada') {
      return res.status(404).json({ message: error.message });
    }
    return next(error);
  }
}

module.exports = {
  list,
  getById,
  getHorasAcumuladas,
  listUrgentMaintenance,
  create,
  update,
  markAsNotOperative,
  blockCritical,
  getBloqueo,
  unblock,
  remove
};
