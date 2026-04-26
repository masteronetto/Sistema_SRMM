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

module.exports = {
  list,
  getById,
  create,
  update,
  remove
};
