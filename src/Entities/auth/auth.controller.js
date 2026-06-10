const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const usuariosRepo = require('../usuarios/usuarios.repository');
const { port } = require('../../config/env');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

async function register(req, res, next) {
try {
const { nombre_completo, email, contrasena } = req.body;

if (!nombre_completo || !email || !contrasena) {
  return res.status(400).json({ message: 'Campos obligatorios: nombre_completo, email, contrasena' });
}

const existing = await usuariosRepo.getUsuarioByEmail(email);
if (existing) {
  return res.status(409).json({ message: 'Ya existe un usuario con ese email' });
}

if (nombre_completo.trim().length < 3) {
  return res.status(400).json({ message: 'El nombre completo debe tener al menos 3 caracteres' });
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const dominiosPermitidos = ['srmm.cl', 'gmail.com', 'hotmail.com', 'outlook.com', 'live.com'];
if (!emailRegex.test(email)) { 
  return res.status(400).json({ message: 'El formato del correo electronico es invalido' });
}

if (!dominiosPermitidos.some(dominio => email.endsWith(`@${dominio}`))) {
  return res.status(400).json({ message: 'Dominio de correo no permitido' });
}

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_])[A-Za-z\d@$!%*?&_]{8,}$/;
if (!passwordRegex.test(contrasena)) {
  return res.status(400).json({ message: 'La contrasena debe tener al menos 8 caracteres, incluir una mayuscula, una minuscula, un numero y un caracter especial (@, $, !, %, *, ?, &, _)' });
}

const hashed = await bcrypt.hash(contrasena, 10);
const user = await usuariosRepo.createUsuario({ nombre_completo, email, contrasena: hashed, rol_acceso: 'Usuario' });

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

const { rows } = await require('../../db/pool').query('SELECT contrasena FROM usuarios WHERE id_usuario = $1', [user.id_usuario]);
const hash = rows[0] && rows[0].contrasena;

const match = hash ? await bcrypt.compare(contrasena, hash) : false;
if (!match) {
  return res.status(401).json({ message: 'Credenciales inválidas' });
}

const payload = {
  id_usuario: user.id_usuario,
  nombre_completo: user.nombre_completo,
  email: user.email,
  rol_acceso: user.rol_acceso
};
const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

return res.json({ token, user: payload });
} catch (error) {
return next(error);
}
}

function createTransporterIfConfigured() {
const host = process.env.SMTP_HOST && process.env.SMTP_HOST.trim();
const smtpUser = process.env.SMTP_USER && process.env.SMTP_USER.trim();
const rawSmtpPass = process.env.SMTP_PASS && process.env.SMTP_PASS.trim();
const isGmailHost = /gmail.com$/i.test(host || '');
const smtpPass = isGmailHost && rawSmtpPass ? rawSmtpPass.replace(/\s+/g, '') : rawSmtpPass;

if (host) {
const auth = smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined;
return nodemailer.createTransport({
host,
port: Number(process.env.SMTP_PORT || 587),
secure: process.env.SMTP_SECURE === 'true',
auth
});
}

if (smtpUser && rawSmtpPass) {
const gmailAppPassword = rawSmtpPass.replace(/\s+/g, '');
return nodemailer.createTransport({
host: 'smtp.gmail.com',
port: 465,
secure: true,
auth: { user: smtpUser, pass: gmailAppPassword }
});
}

return null;
}

async function recover(req, res, next) {
try {
const { email } = req.body;
if (!email) return res.status(400).json({ message: 'Email requerido' });

const user = await usuariosRepo.getUsuarioByEmail(email);
if (!user) return res.status(200).json({ message: 'Si el correo existe, se enviará un email con instrucciones.' });

const token = jwt.sign({ id_usuario: user.id_usuario, type: 'pw-reset' }, JWT_SECRET, { expiresIn: '1h' });
const frontendUrl = (
  process.env.FRONTEND_URL
  || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
  || req.headers.origin
  || `http://localhost:${port}`
).replace(/\/$/, '');
const resetLink = `${frontendUrl}/reset.html?token=${token}`;

const transporter = createTransporterIfConfigured();
if (transporter) {
  const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@sistema-srmm';

  try {
    await transporter.sendMail({
      from: fromAddress,
      to: email,
      subject: 'Recuperación de contraseña - SRMM',
      text: `Para restablecer tu contraseña, visita: ${resetLink}`,
      html: `<p>Para restablecer tu contraseña, haz clic <a href="${resetLink}">aquí</a>.</p>`
    });
  } catch (mailError) {
    console.warn('No se pudo enviar el email de recuperación:', mailError.message || mailError);
    console.warn('Reset link generado:', resetLink);
    const smtpHint = mailError?.responseCode === 535 || /BadCredentials|Invalid login/i.test(mailError?.message || '')
      ? 'Gmail rechazó el acceso: usa una App Password con 2FA activada, sin espacios, y verifica SMTP_USER / SMTP_PASS.'
      : 'Revisa la configuración SMTP y que el remitente pertenezca a la cuenta autorizada.';
    return res.status(502).json({
      message: 'No se pudo enviar el correo de recuperación',
      error: mailError.message || 'SMTP error',
      hint: smtpHint
    });
  }
} else {
  console.log('PASSWORD RESET LINK:', resetLink);
  return res.status(503).json({
    message: 'No hay configuración SMTP válida en este entorno',
    hint: 'Define SMTP_USER y SMTP_PASS (App Password de Gmail, 16 caracteres) o SMTP_HOST/SMTP_PORT/SMTP_SECURE para poder enviar correos.',
    resetLink
  });
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