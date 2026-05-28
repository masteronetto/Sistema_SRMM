const pool = require('../../db/pool');

async function listEventos() {
  const query = `
    SELECT id_evento, titulo, equipo, cliente, ruta, hora_evento, estado_evento, created_at, updated_at
    FROM logistica_eventos
    ORDER BY created_at DESC, id_evento DESC
  `;

  const { rows } = await pool.query(query);
  return rows;
}

async function createEvento({ titulo, equipo, cliente, ruta, hora_evento, estado_evento = 'Pendiente' }) {
  const query = `
    INSERT INTO logistica_eventos (titulo, equipo, cliente, ruta, hora_evento, estado_evento)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id_evento, titulo, equipo, cliente, ruta, hora_evento, estado_evento, created_at, updated_at
  `;

  const { rows } = await pool.query(query, [titulo, equipo, cliente, ruta, hora_evento, estado_evento]);
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