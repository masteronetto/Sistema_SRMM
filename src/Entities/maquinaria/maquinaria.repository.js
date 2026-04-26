const pool = require('../../db/pool');

const baseSelect = `
  SELECT id_maquina, modelo_equipo, horometro_actual, estado, especificaciones, planes_mantencion_id_plan, created_at, updated_at
  FROM maquinaria
`;

async function listMaquinaria() {
  const query = `${baseSelect} ORDER BY id_maquina ASC`;
  const { rows } = await pool.query(query);
  return rows;
}

async function getMaquinariaById(id_maquina) {
  const query = `${baseSelect} WHERE id_maquina = $1`;
  const { rows } = await pool.query(query, [id_maquina]);
  return rows[0] || null;
}

async function createMaquinaria({ modelo_equipo, horometro_actual, estado, especificaciones, planes_mantencion_id_plan }) {
  const query = `
    INSERT INTO maquinaria (modelo_equipo, horometro_actual, estado, especificaciones, planes_mantencion_id_plan)
    VALUES ($1, $2, COALESCE($3, 'Disponible'), $4, $5)
    RETURNING id_maquina, modelo_equipo, horometro_actual, estado, especificaciones, planes_mantencion_id_plan, created_at, updated_at
  `;

  const values = [
    modelo_equipo,
    horometro_actual,
    estado || null,
    especificaciones || null,
    planes_mantencion_id_plan || null
  ];

  const { rows } = await pool.query(query, values);
  return rows[0];
}

async function updateMaquinaria(id_maquina, { modelo_equipo, horometro_actual, estado, especificaciones, planes_mantencion_id_plan }) {
  const query = `
    UPDATE maquinaria
    SET modelo_equipo = $2,
        horometro_actual = $3,
        estado = $4,
        especificaciones = $5,
        planes_mantencion_id_plan = $6,
        updated_at = NOW()
    WHERE id_maquina = $1
    RETURNING id_maquina, modelo_equipo, horometro_actual, estado, especificaciones, planes_mantencion_id_plan, created_at, updated_at
  `;

  const values = [
    id_maquina,
    modelo_equipo,
    horometro_actual,
    estado,
    especificaciones || null,
    planes_mantencion_id_plan || null
  ];

  const { rows } = await pool.query(query, values);
  return rows[0] || null;
}

async function updateHorometroActual(id_maquina, horometro_actual) {
  const query = `
    UPDATE maquinaria
    SET horometro_actual = $2,
        updated_at = NOW()
    WHERE id_maquina = $1
    RETURNING id_maquina, modelo_equipo, horometro_actual, estado, especificaciones, planes_mantencion_id_plan, created_at, updated_at
  `;

  const { rows } = await pool.query(query, [id_maquina, horometro_actual]);
  return rows[0] || null;
}

async function deleteMaquinaria(id_maquina) {
  const query = 'DELETE FROM maquinaria WHERE id_maquina = $1 RETURNING id_maquina';
  const { rowCount } = await pool.query(query, [id_maquina]);
  return rowCount > 0;
}

module.exports = {
  listMaquinaria,
  getMaquinariaById,
  createMaquinaria,
  updateMaquinaria,
  updateHorometroActual,
  deleteMaquinaria
};
