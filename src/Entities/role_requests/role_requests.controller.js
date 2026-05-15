const nodemailer = require('nodemailer');
const roleRequestsRepo = require('./role_requests.repository');

function createTransporterIfConfigured() {
  // Permite configurar SMTP genérico o Gmail mediante variables de entorno
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
  }

  if (process.env.SMTP_GMAIL === 'true' && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }

  return null;
}

async function createRequest(req, res, next) {
  try {
    const { mensaje } = req.body;
    const usuario = req.user; // middleware auth agrega user

    if (!usuario) return res.status(401).json({ message: 'No autorizado' });

    const nombre_usuario = usuario.nombre_completo || null;
    const email_usuario = usuario.email;

    const created = await roleRequestsRepo.createRoleRequest({
      usuario_id: usuario.id_usuario,
      nombre_usuario,
      email_usuario,
      mensaje: mensaje || null,
    });

    // Notificar por correo al administrador si está configurado
    const transporter = createTransporterIfConfigured();
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_ADMIN || 'admin@localhost';
    if (transporter) {
      const subject = `Nueva solicitud de rol de ${nombre_usuario || email_usuario}`;
      const text = `Usuario: ${nombre_usuario || ''} <${email_usuario}>
Mensaje: ${mensaje || ''}
Ver solicitud en el panel de administración.`;

      try {
        await transporter.sendMail({
          from: process.env.SMTP_FROM || 'no-reply@sistema-srmm',
          to: adminEmail,
          subject,
          text,
        });
      } catch (err) {
        console.warn('No se pudo enviar email de notificación al admin:', err.message || err);
      }
    }

    return res.status(201).json({ message: 'Solicitud creada', request: created });
  } catch (error) {
    return next(error);
  }
}

async function listRequests(req, res, next) {
  try {
    const limit = Number(req.query.limit || 50);
    const offset = Number(req.query.offset || 0);
    const requests = await roleRequestsRepo.listRoleRequests({ limit, offset });

    return res.json(requests);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createRequest,
  listRequests,
};
