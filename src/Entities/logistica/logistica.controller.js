const maquinariaRepo = require('../maquinaria/maquinaria.repository');
const logisticaRepo = require('./logistica.repository');
const arriendosRepo = require('../arriendos/arriendos.repository');

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

function validateEventoEstado(estado_evento) {
  const allowedStates = new Set(['Pendiente', 'Confirmado', 'En Ruta', 'Completado', 'Cancelado']);
  return estado_evento && allowedStates.has(String(estado_evento).trim());
}

async function update(req, res, next) {
  try {
    const id_evento = Number(req.params.id_evento);
    if (!Number.isFinite(id_evento)) {
      return res.status(400).json({ message: 'id_evento debe ser numerico' });
    }

    const estado_evento = req.body.estado_evento ? String(req.body.estado_evento).trim() : '';
    if (!validateEventoEstado(estado_evento)) {
      return res.status(400).json({ message: 'Estado inválido. Valores permitidos: Pendiente, Confirmado, En Ruta, Completado, Cancelado' });
    }

    const evento = await logisticaRepo.getEventoById(id_evento);
    if (!evento) {
      return res.status(404).json({ message: 'Evento no encontrado' });
    }

    if (req.user.rol_acceso === 'Operador') {
      if (!evento.maquinaria_id_maquina) {
        return res.status(403).json({ message: 'No puedes cambiar el estado de un evento no vinculado a una máquina' });
      }

      const contrato = await arriendosRepo.getArriendoActivoByMaquina(evento.maquinaria_id_maquina);
      if (!contrato || contrato.cliente_id !== Number(req.user.id_usuario)) {
        return res.status(403).json({ message: 'Permisos insuficientes. Solo puedes gestionar eventos de tus máquinas' });
      }

      const currentStatus = String(evento.estado_evento || 'Pendiente').trim();
      const transitions = {
        Pendiente: ['Confirmado'],
        Confirmado: ['En Ruta'],
        'En Ruta': ['Completado'],
        Completado: [],
        Cancelado: []
      };

      const allowed = transitions[currentStatus] || [];
      if (!allowed.includes(estado_evento)) {
        return res.status(403).json({ message: `No puedes cambiar el estado de '${currentStatus}' a '${estado_evento}'` });
      }
    }

    const updated = await logisticaRepo.updateEventoStatus(id_evento, estado_evento);
    if (!updated) {
      return res.status(404).json({ message: 'Evento no encontrado al actualizar' });
    }

    return res.json(updated);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  list,
  create,
  update,
  remove
};