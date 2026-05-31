const pool = require('../../db/pool');

async function listArriendos() {
  const query = `
    SELECT
      a.id_contrato,
      a.maquinaria_id_maquina,
      m.modelo_equipo,
      a.cliente_id,
      u.nombre_completo AS cliente_nombre,
      a.horometro_entrada,
      a.horometro_salida,
      a.fecha_inicio,
      a.fecha_fin,
      a.estado_contrato,
      a.created_at,
      a.updated_at
    FROM arriendos a
    INNER JOIN maquinaria m ON m.id_maquina = a.maquinaria_id_maquina
    LEFT JOIN usuarios u ON u.id_usuario = a.cliente_id
    ORDER BY a.created_at DESC, a.id_contrato DESC
  `;

  const { rows } = await pool.query(query);
  return rows;
}

async function createArriendo({ maquinaria_id_maquina, cliente_id = null, horometro_entrada = null, horometro_salida = null, fecha_inicio = null, fecha_fin = null, estado_contrato = 'Activo' }) {
  const query = `
    INSERT INTO arriendos (
      maquinaria_id_maquina,
      cliente_id,
      horometro_entrada,
      horometro_salida,
      fecha_inicio,
      fecha_fin,
      estado_contrato
    ) VALUES ($1, $2, $3, $4, COALESCE($5, CURRENT_DATE), $6, COALESCE($7, 'Activo'))
    RETURNING id_contrato, maquinaria_id_maquina, cliente_id, horometro_entrada, horometro_salida, fecha_inicio, fecha_fin, estado_contrato, created_at, updated_at
  `;

  const values = [
    maquinaria_id_maquina,
    cliente_id,
    horometro_entrada,
    horometro_salida,
    fecha_inicio,
    fecha_fin,
    estado_contrato
  ];

  const { rows } = await pool.query(query, values);
  return rows[0] || null;
}

async function listArriendosByCliente(cliente_id) {
  const query = `
    SELECT
      a.id_contrato,
      a.maquinaria_id_maquina,
      m.modelo_equipo,
      a.cliente_id,
      u.nombre_completo AS cliente_nombre,
      a.horometro_entrada,
      a.horometro_salida,
      a.fecha_inicio,
      a.fecha_fin,
      a.estado_contrato,
      a.created_at,
      a.updated_at
    FROM arriendos a
    INNER JOIN maquinaria m ON m.id_maquina = a.maquinaria_id_maquina
    LEFT JOIN usuarios u ON u.id_usuario = a.cliente_id
    WHERE a.cliente_id = $1
    ORDER BY a.created_at DESC, a.id_contrato DESC
  `;

  const { rows } = await pool.query(query, [cliente_id]);
  return rows;
}

async function deleteArriendo(id_contrato) {
  const query = 'DELETE FROM arriendos WHERE id_contrato = $1 RETURNING id_contrato';
  const { rows } = await pool.query(query, [id_contrato]);
  return rows[0] || null;
}

module.exports = {
  listArriendos,
  createArriendo,
  deleteArriendo
};