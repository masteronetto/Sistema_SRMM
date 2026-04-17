const pool = require('../../db/pool');

const baseSelect = `
  SELECT id_mantenedor, tipo, codigo, nombre, descripcion, activo, created_at, updated_at
  FROM mantenedores
`;

async function listMantenedores() {
  const query = `${baseSelect} ORDER BY tipo ASC, codigo ASC`;
  const { rows } = await pool.query(query);
  return rows;
}

async function getMantenedorById(id) {
  const query = `${baseSelect} WHERE id_mantenedor = $1`;
  const { rows } = await pool.query(query, [id]);
  return rows[0] || null;
}

async function createMantenedor({ tipo, codigo, nombre, descripcion, activo }) {
  const query = `
    INSERT INTO mantenedores (tipo, codigo, nombre, descripcion, activo)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id_mantenedor, tipo, codigo, nombre, descripcion, activo, created_at, updated_at
  `;
  const values = [tipo, codigo, nombre, descripcion || null, activo ?? true];
  const { rows } = await pool.query(query, values);
  return rows[0];
}

async function updateMantenedor(id, { tipo, codigo, nombre, descripcion, activo }) {
  const query = `
    UPDATE mantenedores
    SET tipo = $2,
        codigo = $3,
        nombre = $4,
        descripcion = $5,
        activo = $6,
        updated_at = NOW()
    WHERE id_mantenedor = $1
    RETURNING id_mantenedor, tipo, codigo, nombre, descripcion, activo, created_at, updated_at
  `;
  const values = [id, tipo, codigo, nombre, descripcion || null, activo ?? true];
  const { rows } = await pool.query(query, values);
  return rows[0] || null;
}

async function deleteMantenedor(id) {
  const query = 'DELETE FROM mantenedores WHERE id_mantenedor = $1 RETURNING id_mantenedor';
  const { rowCount } = await pool.query(query, [id]);
  return rowCount > 0;
}

module.exports = {
  listMantenedores,
  getMantenedorById,
  createMantenedor,
  updateMantenedor,
  deleteMantenedor
};
