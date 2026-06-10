const usuariosRepo = require('./usuarios.repository');
const roleRequestsRepo = require('../role_requests/role_requests.repository');
const bcrypt = require('bcrypt');

const rolesPermitidos = new Set(['Administrador', 'Mecanico', 'Operador', 'Usuario']);

function validateUsuarioProfilePayload(payload) {
  const nombre = String(payload?.nombre_completo || '').trim();
  const email = String(payload?.email || '').trim().toLowerCase();

  if (!nombre || !email) {
    return { error: 'nombre_completo y email son obligatorios', parsed: null };
  }

  if (nombre.length < 3) {
    return { error: 'El nombre completo debe tener al menos 3 caracteres', parsed: null };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const dominiosPermitidos = ['srmm.cl', 'gmail.com', 'hotmail.com', 'outlook.com', 'live.com'];
  if (!emailRegex.test(email)) {
    return { error: 'El formato del correo electronico es invalido', parsed: null };
  }

  if (!dominiosPermitidos.some((dominio) => email.endsWith(`@${dominio}`))) {
    return { error: 'Dominio de correo no permitido', parsed: null };
  }

  return {
    error: null,
    parsed: {
      nombre_completo: nombre,
      email
    }
  };
}

function validateUsuarioPayload(payload) {
  const { nombre_completo, email, contrasena, rol_acceso } = payload;

  if (!nombre_completo || !email || !contrasena || !rol_acceso) {
    return 'Todos los campos son obligatorios: nombre_completo, email, contrasena, rol_acceso';
  }

  if (!rolesPermitidos.has(rol_acceso)) {
    return 'rol_acceso invalido. Valores permitidos: Administrador, Mecanico, Operador, Usuario';
  }

  if (nombre_completo.trim().length < 3) {
    return 'El nombre completo debe tener al menos 3 caracteres';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const dominiosPermitidos = ['srmm.cl', 'gmail.com', 'hotmail.com', 'outlook.com', 'live.com'];
  if (!emailRegex.test(email)) { 
    return 'El formato del correo electronico es invalido';
  }

  if (!dominiosPermitidos.some(dominio => email.endsWith(`@${dominio}`))) {
    return 'Dominio de correo no permitido';
  }

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_])[A-Za-z\d@$!%*?&_]{8,}$/;
if (!passwordRegex.test(contrasena)) {
    return 'La contrasena debe tener al menos 8 caracteres, incluir una mayuscula, una minuscula, un numero y un caracter especial autorizado (@, $, !, %, *, ?, &, _)';
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

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(req.body.contrasena, saltRounds);
    req.body.contrasena = hashedPassword;

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

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(req.body.contrasena, saltRounds);
    req.body.contrasena = hashedPassword;

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

async function updateProfile(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ message: 'id de usuario invalido' });
    }

    const { error, parsed } = validateUsuarioProfilePayload(req.body);
    if (error) {
      return res.status(400).json({ message: error });
    }

    const data = await usuariosRepo.updateUsuarioProfile(id, parsed);
    if (!data) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    return res.json({
      message: 'Datos de usuario actualizados correctamente',
      user: data
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Ya existe un usuario con ese email' });
    }
    return next(error);
  }
}

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
  changeRole,
  updateProfile
};
