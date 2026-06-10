const jwt = require('jsonwebtoken');
const pool = require('../db/pool');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

function normalizeRole(role) {
  return String(role || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Verifica si un usuario está activo consultando la BD
 * Esto previene que usuarios desactivados mantengan acceso a través de tokens válidos
 */
async function verifyUserActive(userId) {
  try {
    const result = await pool.query(
      'SELECT activo FROM usuarios WHERE id_usuario = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return false; // Usuario no existe
    }

    return result.rows[0].activo === true; // Usuario debe estar activo
  } catch (error) {
    console.error('Error al verificar estado de usuario:', error);
    return false; // En caso de error, denegar acceso
  }
}

function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token no proporcionado' });
    }

    const token = authHeader.substring(7);
    const payload = jwt.verify(token, JWT_SECRET);
    
    req.user = payload;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expirado' });
    }
    return res.status(401).json({ message: 'Token inválido' });
  }
}

/**
 * Middleware que valida que el usuario siga activo
 * Debe usarse después de verifyToken
 */
async function requireActiveUser(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    const isActive = await verifyUserActive(req.user.id_usuario);
    
    if (!isActive) {
      return res.status(401).json({ 
        message: 'Tu cuenta ha sido desactivada. Contacta al administrador.',
        deactivated: true
      });
    }

    next();
  } catch (error) {
    console.error('Error en requireActiveUser:', error);
    return res.status(500).json({ message: 'Error al verificar estado de usuario' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: 'No autenticado' });
  }

  if (normalizeRole(req.user.rol_acceso) !== 'administrador') {
    return res.status(403).json({ message: 'Permisos insuficientes. Solo administradores pueden realizar esta acción.' });
  }

  next();
}

function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: 'No autenticado' });
  }
  next();
}

function requireMecanicoOrAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: 'No autenticado' });
  }

  const role = normalizeRole(req.user.rol_acceso);
  if (role === 'mecanico' || role === 'administrador') {
    return next();
  }

  return res.status(403).json({ message: 'Permisos insuficientes. Requiere rol Mecánico o Administrador.' });
}

function requireOperadorOrAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: 'No autenticado' });
  }

  const role = normalizeRole(req.user.rol_acceso);
  if (role === 'operador' || role === 'administrador') {
    return next();
  }

  return res.status(403).json({ message: 'Permisos insuficientes. Requiere rol Operador o Administrador.' });
}

function requireMecanicoOperadorOrAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: 'No autenticado' });
  }

  const role = normalizeRole(req.user.rol_acceso);
  if (role === 'mecanico' || role === 'operador' || role === 'administrador') {
    return next();
  }

  return res.status(403).json({ message: 'Permisos insuficientes. Requiere rol Mecánico, Operador o Administrador.' });
}

module.exports = {
  verifyToken,
  requireAdmin,
  requireAuth,
  requireMecanicoOrAdmin,
  requireOperadorOrAdmin,
  requireMecanicoOperadorOrAdmin,
  requireActiveUser
};

