const pool = require('../../db/pool');

const baseSelect = `
  SELECT id_mantencion, tipo_servicio, horometro_registro, detalle_tecnico, fecha_servicio, maquinaria_id_maquina, usuarios_id_usuario, created_at
  FROM mantenimiento
`;

async function getMantenimientoById(id_mantencion) {
  const query = `${baseSelect} WHERE id_mantencion = $1`;
  const { rows } = await pool.query(query, [id_mantencion]);
  return rows[0] || null;
}

async function listMantenimientosByMaquina(maquinaria_id_maquina) {
  const query = `${baseSelect} WHERE maquinaria_id_maquina = $1 ORDER BY fecha_servicio DESC, id_mantencion DESC`;
  const { rows } = await pool.query(query, [maquinaria_id_maquina]);
  return rows;
}

async function createMantenimiento({ tipo_servicio, horometro_registro, detalle_tecnico, fecha_servicio, maquinaria_id_maquina, usuarios_id_usuario }) {
  const query = `
    INSERT INTO mantenimiento (
      tipo_servicio,
      horometro_registro,
      detalle_tecnico,
      fecha_servicio,
      maquinaria_id_maquina,
      usuarios_id_usuario
    ) VALUES ($1, $2, $3, COALESCE($4, CURRENT_DATE), $5, $6)
    RETURNING id_mantencion, tipo_servicio, horometro_registro, detalle_tecnico, fecha_servicio, maquinaria_id_maquina, usuarios_id_usuario, created_at
  `;

  const values = [
    tipo_servicio,
    horometro_registro,
    detalle_tecnico,
    fecha_servicio || null,
    maquinaria_id_maquina,
    usuarios_id_usuario
  ];

  const { rows } = await pool.query(query, values);
  return rows[0];
}

module.exports = {
  getMantenimientoById,
  listMantenimientosByMaquina,
  createMantenimiento
};
