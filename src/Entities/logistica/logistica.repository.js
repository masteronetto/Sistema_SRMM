const pool = require('../../db/pool');

async function listEventos({ maquinariaIds = [] } = {}) {
  const ids = Array.isArray(maquinariaIds)
    ? maquinariaIds.map((value) => Number(value)).filter((value) => Number.isFinite(value) && value > 0)
    : [];

  const values = [];
  let whereClause = '';
  if (ids.length) {
    values.push(ids);
    whereClause = 'WHERE l.maquinaria_id_maquina = ANY($1::bigint[])';
  }

  const query = `
    SELECT
      l.id_evento,
      l.maquinaria_id_maquina,
      m.modelo_equipo AS maquinaria_modelo,
      l.titulo,
      l.equipo,
      l.cliente,
      l.ruta,
      l.hora_evento,
      l.estado_evento,
      l.created_at,
      l.updated_at
    FROM logistica_eventos l
    LEFT JOIN maquinaria m ON m.id_maquina = l.maquinaria_id_maquina
    ${whereClause}
    ORDER BY l.created_at DESC, l.id_evento DESC
  `;

  const { rows } = await pool.query(query, values);
  return rows;
}

async function createEvento({ titulo, equipo, cliente, ruta, hora_evento, estado_evento = 'Pendiente', maquinaria_id_maquina = null }) {
  const query = `
    INSERT INTO logistica_eventos (maquinaria_id_maquina, titulo, equipo, cliente, ruta, hora_evento, estado_evento)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id_evento, maquinaria_id_maquina, titulo, equipo, cliente, ruta, hora_evento, estado_evento, created_at, updated_at
  `;

  const { rows } = await pool.query(query, [maquinaria_id_maquina || null, titulo, equipo, cliente, ruta, hora_evento, estado_evento]);
  return rows[0] || null;
}

async function deleteEvento(id_evento) {
  const query = 'DELETE FROM logistica_eventos WHERE id_evento = $1 RETURNING id_evento';
  const { rows } = await pool.query(query, [id_evento]);
  return rows[0] || null;
}

module.exports = {
  listEventos,
  createEvento,
  deleteEvento
};