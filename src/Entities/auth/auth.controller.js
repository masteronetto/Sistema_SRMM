const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const usuariosRepo = require('../usuarios/usuarios.repository');
const { port } = require('../../config/env');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

async function register(req, res, next) {
  try {
    const { nombre_completo, email, contrasena, rol_acceso } = req.body;

    if (!nombre_completo || !email || !contrasena || !rol_acceso) {
      return res.status(400).json({ message: 'Campos obligatorios: nombre_completo, email, contrasena, rol_acceso' });
    }

    const existing = await usuariosRepo.getUsuarioByEmail(email);
    if (existing) {
      return res.status(409).json({ message: 'Ya existe un usuario con ese email' });
    }

    const hashed = await bcrypt.hash(contrasena, 10);
    const user = await usuariosRepo.createUsuario({ nombre_completo, email, contrasena: hashed, rol_acceso });

    return res.status(201).json(user);
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, contrasena } = req.body;
    if (!email || !contrasena) {
      return res.status(400).json({ message: 'Email y contrasena son requeridos' });
    }

    const user = await usuariosRepo.getUsuarioByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const stored = await usuariosRepo.getUsuarioById(user.id_usuario);
    // stored.contrasena no included in baseSelect, fetch raw row
    const { rows } = await require('../../db/pool').query('SELECT contrasena FROM usuarios WHERE id_usuario = $1', [user.id_usuario]);
    const hash = rows[0] && rows[0].contrasena;

    const match = hash ? await bcrypt.compare(contrasena, hash) : false;
    if (!match) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const payload = { id_usuario: user.id_usuario, email: user.email, rol_acceso: user.rol_acceso };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    return res.json({ token, user: payload });
  } catch (error) {
    return next(error);
  }
}

function createTransporterIfConfigured() {
  const host = process.env.SMTP_HOST;
  if (!host) return null;
  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
  });
}

async function recover(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email requerido' });

    const user = await usuariosRepo.getUsuarioByEmail(email);
    if (!user) return res.status(200).json({ message: 'Si el correo existe, se enviará un email con instrucciones.' });

    const token = jwt.sign({ id_usuario: user.id_usuario, type: 'pw-reset' }, JWT_SECRET, { expiresIn: '1h' });
    const frontendUrl = process.env.FRONTEND_URL || `http://localhost:${port}`;
    const resetLink = `${frontendUrl.replace(/\/$/, '')}/reset.html?token=${token}`;

    const transporter = createTransporterIfConfigured();
    if (transporter) {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'no-reply@sistema-srmm',
        to: email,
        subject: 'Recuperación de contraseña - SRMM',
        text: `Para restablecer tu contraseña, visita: ${resetLink}`,
        html: `<p>Para restablecer tu contraseña, haz clic <a href="${resetLink}">aquí</a>.</p>`
      });
    } else {
      console.log('PASSWORD RESET LINK:', resetLink);
    }

    return res.status(200).json({ message: 'Si el correo existe, se enviará un email con instrucciones.' });
  } catch (error) {
    return next(error);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ message: 'Token y newPassword requeridos' });

    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ message: 'Token inválido o expirado' });
    }

    if (payload.type !== 'pw-reset' || !payload.id_usuario) {
      return res.status(400).json({ message: 'Token inválido' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    const updated = await usuariosRepo.updateUsuarioPassword(payload.id_usuario, hashed);
    if (!updated) return res.status(404).json({ message: 'Usuario no encontrado' });

    return res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  register,
  login,
  recover,
  resetPassword
};
