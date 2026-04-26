const usuariosRepo = require('./usuarios.repository');

const rolesPermitidos = new Set(['Administrador', 'Mecanico', 'Operador', 'Cliente']);

function validateUsuarioPayload(payload) {
  const { nombre_completo, email, contrasena, rol_acceso } = payload;

  if (!nombre_completo || !email || !contrasena || !rol_acceso) {
    return 'Todos los campos son obligatorios: nombre_completo, email, contrasena, rol_acceso';
  }

  if (!rolesPermitidos.has(rol_acceso)) {
    return 'rol_acceso invalido. Valores permitidos: Administrador, Mecanico, Operador, Cliente';
  }

  return null;
}

async function list(req, res, next) {
  try {
    const data = await usuariosRepo.listUsuarios();
    res.json(data);
  } catch (error) {
    next(error);
  }
}

async function getById(req, res, next) {
  try {
    const id = Number(req.params.id);
    const data = await usuariosRepo.getUsuarioById(id);

    if (!data) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

async function create(req, res, next) {
  try {
    const validationError = validateUsuarioPayload(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const data = await usuariosRepo.createUsuario(req.body);
    return res.status(201).json(data);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Ya existe un usuario con ese email' });
    }
    return next(error);
  }
}

async function update(req, res, next) {
  try {
    const id = Number(req.params.id);
    const validationError = validateUsuarioPayload(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const data = await usuariosRepo.updateUsuario(id, req.body);
    if (!data) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    return res.json(data);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Ya existe un usuario con ese email' });
    }
    return next(error);
  }
}

async function remove(req, res, next) {
  try {
    const id = Number(req.params.id);
    const deleted = await usuariosRepo.deleteUsuario(id);

    if (!deleted) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
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
