const logisticaRepo = require('./logistica.repository');

function validateEventoPayload(payload) {
  const titulo = payload.titulo ? String(payload.titulo).trim() : '';
  const equipo = payload.equipo ? String(payload.equipo).trim() : '';
  const cliente = payload.cliente ? String(payload.cliente).trim() : '';
  const ruta = payload.ruta ? String(payload.ruta).trim() : '';
  const hora_evento = payload.hora_evento ? String(payload.hora_evento).trim() : '';
  const estado_evento = payload.estado_evento ? String(payload.estado_evento).trim() : 'Pendiente';

  if (!titulo || !equipo || !cliente || !ruta || !hora_evento) {
    return { error: 'Campos obligatorios: titulo, equipo, cliente, ruta, hora_evento', parsed: null };
  }

  return { error: null, parsed: { titulo, equipo, cliente, ruta, hora_evento, estado_evento } };
}

async function list(req, res, next) {
  try {
    const rows = await logisticaRepo.listEventos();
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