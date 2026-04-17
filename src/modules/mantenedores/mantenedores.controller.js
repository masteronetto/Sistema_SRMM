const mantenedoresRepo = require('./mantenedores.repository');

function validatePayload(payload) {
  const { tipo, codigo, nombre } = payload;

  if (!tipo || !codigo || !nombre) {
    return 'Campos obligatorios: tipo, codigo, nombre';
  }

  return null;
}

async function list(req, res, next) {
  try {
    const data = await mantenedoresRepo.listMantenedores();
    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

async function getById(req, res, next) {
  try {
    const id = Number(req.params.id);
    const data = await mantenedoresRepo.getMantenedorById(id);

    if (!data) {
      return res.status(404).json({ message: 'Mantenedor no encontrado' });
    }

    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

async function create(req, res, next) {
  try {
    const validationError = validatePayload(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const data = await mantenedoresRepo.createMantenedor(req.body);
    return res.status(201).json(data);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'El codigo ya existe para ese tipo de mantenedor' });
    }
    return next(error);
  }
}

async function update(req, res, next) {
  try {
    const id = Number(req.params.id);
    const validationError = validatePayload(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const data = await mantenedoresRepo.updateMantenedor(id, req.body);
    if (!data) {
      return res.status(404).json({ message: 'Mantenedor no encontrado' });
    }

    return res.json(data);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'El codigo ya existe para ese tipo de mantenedor' });
    }
    return next(error);
  }
}

async function remove(req, res, next) {
  try {
    const id = Number(req.params.id);
    const deleted = await mantenedoresRepo.deleteMantenedor(id);

    if (!deleted) {
      return res.status(404).json({ message: 'Mantenedor no encontrado' });
    }

    return res.status(204).send();
  } catch (error) {
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
