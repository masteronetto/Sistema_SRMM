const pool = require('../../db/pool');

const baseSelect = `
  SELECT id_registro, valor_horas, fecha_registro, maquinaria_id_maquina, arriendos_id_contrato, id_usuario, created_at
  FROM historial_horometro
`;

async function getUltimoHistorialByMaquina(maquinaria_id_maquina) {
  const query = `${baseSelect} WHERE maquinaria_id_maquina = $1 ORDER BY fecha_registro DESC, id_registro DESC LIMIT 1`;
  const { rows } = await pool.query(query, [maquinaria_id_maquina]);
  return rows[0] || null;
}

async function createHistorialUso({ maquinaria_id_maquina, valor_horas, id_usuario, fecha_registro, arriendos_id_contrato }) {
  const query = `
    INSERT INTO historial_horometro (maquinaria_id_maquina, valor_horas, id_usuario, fecha_registro, arriendos_id_contrato)
    VALUES ($1, $2, $3, COALESCE($4, CURRENT_DATE), $5)
    RETURNING id_registro, valor_horas, fecha_registro, maquinaria_id_maquina, arriendos_id_contrato, id_usuario, created_at
  `;

  const values = [maquinaria_id_maquina, valor_horas, id_usuario, fecha_registro || null, arriendos_id_contrato || null];
  const { rows } = await pool.query(query, values);
  return rows[0];
}

async function listHistorialByMaquina(maquinaria_id_maquina) {
  const query = `${baseSelect} WHERE maquinaria_id_maquina = $1 ORDER BY fecha_registro ASC, id_registro ASC`;
  const { rows } = await pool.query(query, [maquinaria_id_maquina]);
  return rows;
}

module.exports = {
  getUltimoHistorialByMaquina,
  createHistorialUso,
  listHistorialByMaquina
};
