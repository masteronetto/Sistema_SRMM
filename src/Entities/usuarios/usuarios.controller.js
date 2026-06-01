const usuariosRepo = require('./usuarios.repository');
const roleRequestsRepo = require('../role_requests/role_requests.repository');

const rolesPermitidos = new Set(['Administrador', 'Mecanico', 'Operador', 'Usuario']);

function validateUsuarioPayload(payload) {
  const { nombre_completo, email, contrasena, rol_acceso } = payload;

  if (!nombre_completo || !email || !contrasena || !rol_acceso) {
    return 'Todos los campos son obligatorios: nombre_completo, email, contrasena, rol_acceso';
  }

  if (!rolesPermitidos.has(rol_acceso)) {
    return 'rol_acceso invalido. Valores permitidos: Administrador, Mecanico, Operador, Usuario';
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

async function changeRole(req, res, next) {
  try {
    const id = Number(req.params.id);
    const { rol_acceso } = req.body;

    if (!rol_acceso) {
      return res.status(400).json({ message: 'rol_acceso es requerido' });
    }

    if (!rolesPermitidos.has(rol_acceso)) {
      return res.status(400).json({ message: 'rol_acceso inválido. Valores permitidos: Administrador, Mecanico, Operador, Usuario' });
    }

    // No permite cambiar el rol del usuario actual a sí mismo
    if (req.user && req.user.id_usuario === id && rol_acceso !== req.user.rol_acceso) {
      // Permite cambios, pero es mejor lo advierta
    }

    const data = await usuariosRepo.updateUsuarioRole(id, rol_acceso);
    if (!data) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const deletedRequests = await roleRequestsRepo.deleteRoleRequestsByUsuarioId(id);

    return res.json({
      message: 'Rol actualizado correctamente',
      user: data,
      deleted_role_requests: deletedRequests,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
  changeRole
};
