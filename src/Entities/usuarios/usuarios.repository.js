const pool = require('../../db/pool');

const baseSelect = `
  SELECT id_usuario, nombre_completo, email, rol_acceso, created_at, updated_at
  FROM usuarios
`;

async function listUsuarios() {
  const query = `${baseSelect} ORDER BY id_usuario ASC`;
  const { rows } = await pool.query(query);
  return rows;
}

async function getUsuarioById(id) {
  const query = `${baseSelect} WHERE id_usuario = $1`;
  const { rows } = await pool.query(query, [id]);
  return rows[0] || null;
}

async function createUsuario({ nombre_completo, email, contrasena, rol_acceso }) {
  const query = `
    INSERT INTO usuarios (nombre_completo, email, contrasena, rol_acceso)
    VALUES ($1, $2, $3, $4)
    RETURNING id_usuario, nombre_completo, email, rol_acceso, created_at, updated_at
  `;
  const values = [nombre_completo, email, contrasena, rol_acceso];
  const { rows } = await pool.query(query, values);
  return rows[0];
}

async function updateUsuario(id, { nombre_completo, email, contrasena, rol_acceso }) {
  const query = `
    UPDATE usuarios
    SET nombre_completo = $2,
        email = $3,
        contrasena = $4,
        rol_acceso = $5,
        updated_at = NOW()
    WHERE id_usuario = $1
    RETURNING id_usuario, nombre_completo, email, rol_acceso, created_at, updated_at
  `;
  const values = [id, nombre_completo, email, contrasena, rol_acceso];
  const { rows } = await pool.query(query, values);
  return rows[0] || null;
}

async function deleteUsuario(id) {
  const query = 'DELETE FROM usuarios WHERE id_usuario = $1 RETURNING id_usuario';
  const { rowCount } = await pool.query(query, [id]);
  return rowCount > 0;
}

module.exports = {
  listUsuarios,
  getUsuarioById,
  createUsuario,
  updateUsuario,
  deleteUsuario
};
