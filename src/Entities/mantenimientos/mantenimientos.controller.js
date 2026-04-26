const mantenimientosRepo = require('./mantenimientos.repository');
const maquinariaRepo = require('../maquinaria/maquinaria.repository');
const usuariosRepo = require('../usuarios/usuarios.repository');

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
  const tipo_servicio = payload.tipo_servicio;
  const horometro_registro = toNumberOrNull(payload.horometro_registro);
  const maquinaria_id_maquina = toNumberOrNull(payload.maquinaria_id_maquina);
  const usuarios_id_usuario = toNumberOrNull(payload.usuarios_id_usuario);

  if (!tipo_servicio || horometro_registro === null || maquinaria_id_maquina === null || usuarios_id_usuario === null || !payload.detalle_tecnico) {
    return {
      error: 'Campos obligatorios: tipo_servicio, horometro_registro, detalle_tecnico, maquinaria_id_maquina, usuarios_id_usuario',
      parsed: null
    };
  }

  const fecha_servicio = payload.fecha_servicio || null;

  return {
    error: null,
    parsed: {
      tipo_servicio,
      horometro_registro,
      detalle_tecnico: payload.detalle_tecnico,
      fecha_servicio,
      maquinaria_id_maquina,
      usuarios_id_usuario
    }
  };
}

async function create(req, res, next) {
  try {
    const { error, parsed } = validatePayload(req.body);
    if (error) {
      return res.status(400).json({ message: error });
    }

    const maquinaria = await maquinariaRepo.getMaquinariaById(parsed.maquinaria_id_maquina);
    if (!maquinaria) {
      return res.status(404).json({ message: 'Maquinaria no encontrada' });
    }

    const usuario = await usuariosRepo.getUsuarioById(parsed.usuarios_id_usuario);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (parsed.horometro_registro > Number(maquinaria.horometro_actual)) {
      return res.status(400).json({
        message: 'horometro_registro no puede ser mayor al horometro_actual de la maquinaria'
      });
    }

    const data = await mantenimientosRepo.createMantenimiento(parsed);
    return res.status(201).json(data);
  } catch (error) {
    if (error.code === '23503') {
      return res.status(400).json({ message: 'Referencia invalida en maquinaria o usuarios' });
    }
    return next(error);
  }
}

async function listByMaquina(req, res, next) {
  try {
    const maquinaria_id_maquina = toNumberOrNull(req.params.maquinaria_id_maquina);
    if (maquinaria_id_maquina === null) {
      return res.status(400).json({ message: 'maquinaria_id_maquina debe ser numerico y mayor o igual a 0' });
    }

    const data = await mantenimientosRepo.listMantenimientosByMaquina(maquinaria_id_maquina);
    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  create,
  listByMaquina
};
