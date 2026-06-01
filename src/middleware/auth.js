const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

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

function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: 'No autenticado' });
  }

  if (req.user.rol_acceso !== 'Administrador') {
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

  const role = req.user.rol_acceso;
  if (role === 'Mecanico' || role === 'Administrador') {
    return next();
  }

  return res.status(403).json({ message: 'Permisos insuficientes. Requiere rol Mecánico o Administrador.' });
}

function requireOperadorOrAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: 'No autenticado' });
  }

  const role = req.user.rol_acceso;
  if (role === 'Operador' || role === 'Administrador') {
    return next();
  }

  return res.status(403).json({ message: 'Permisos insuficientes. Requiere rol Operador o Administrador.' });
}

function requireMecanicoOperadorOrAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: 'No autenticado' });
  }

  const role = req.user.rol_acceso;
  if (role === 'Mecanico' || role === 'Operador' || role === 'Administrador') {
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
  requireMecanicoOperadorOrAdmin
};
