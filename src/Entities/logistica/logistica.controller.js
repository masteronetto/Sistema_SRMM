const maquinariaRepo = require('../maquinaria/maquinaria.repository');
const logisticaRepo = require('./logistica.repository');

function validateEventoPayload(payload) {
  const maquinaria_id_maquina = payload.maquinaria_id_maquina === undefined || payload.maquinaria_id_maquina === null || payload.maquinaria_id_maquina === ''
    ? null
    : Number(payload.maquinaria_id_maquina);
  const titulo = payload.titulo ? String(payload.titulo).trim() : '';
  const equipo = payload.equipo ? String(payload.equipo).trim() : '';
  const cliente = payload.cliente ? String(payload.cliente).trim() : '';
  const ruta = payload.ruta ? String(payload.ruta).trim() : '';
  const hora_evento = payload.hora_evento ? String(payload.hora_evento).trim() : '';
  const estado_evento = payload.estado_evento ? String(payload.estado_evento).trim() : 'Pendiente';

  if (!titulo || !equipo || !cliente || !ruta || !hora_evento) {
    return { error: 'Campos obligatorios: titulo, equipo, cliente, ruta, hora_evento', parsed: null };
  }

  if (maquinaria_id_maquina !== null && !Number.isFinite(maquinaria_id_maquina)) {
    return { error: 'maquinaria_id_maquina debe ser numerico si se envia', parsed: null };
  }

  return { error: null, parsed: { titulo, equipo, cliente, ruta, hora_evento, estado_evento, maquinaria_id_maquina } };
}

async function list(req, res, next) {
  try {
    const maquinariaIds = typeof req.query.maquinaria_ids === 'string' && req.query.maquinaria_ids.trim() !== ''
      ? req.query.maquinaria_ids.split(',').map((value) => Number(value.trim())).filter((value) => Number.isFinite(value) && value > 0)
      : [];

    const rows = await logisticaRepo.listEventos({ maquinariaIds });
    return res.json(rows);
  } catch (error) {
    return next(error);
  }
}

async function create(req, res, next) {
  try {
    const { error, parsed } = validateEventoPayload(req.body);
    if (error) {
      return res.status(400).json({ message: error });
    }

    if (parsed.maquinaria_id_maquina !== null) {
      const maquina = await maquinariaRepo.getMaquinariaById(parsed.maquinaria_id_maquina);
      if (!maquina) {
        return res.status(404).json({ message: 'La máquina asociada no existe' });
      }
    }

    const evento = await logisticaRepo.createEvento(parsed);
    return res.status(201).json(evento);
  } catch (error) {
    return next(error);
  }
}

async function remove(req, res, next) {
  try {
    const id_evento = Number(req.params.id_evento);
    if (!Number.isFinite(id_evento)) {
      return res.status(400).json({ message: 'id_evento debe ser numerico' });
    }

    const deleted = await logisticaRepo.deleteEvento(id_evento);
    if (!deleted) {
      return res.status(404).json({ message: 'Evento no encontrado' });
    }

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  list,
  create,
  remove
};