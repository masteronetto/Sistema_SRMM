const pool = require('../../db/pool');

async function getHistorialUnificado(id_maquina, fecha_inicio, fecha_fin) {
  let query = `
    SELECT * FROM vista_historial_completo 
    WHERE maquinaria_id_maquina = $1
  `;
  const values = [id_maquina];
  let paramsCount = 1;

  if (fecha_inicio) {
    paramsCount++;
    query += ` AND fecha_evento >= $${paramsCount}`;
    values.push(fecha_inicio);
  }
  if (fecha_fin) {
    paramsCount++;
    query += ` AND fecha_evento <= $${paramsCount}`;
    values.push(fecha_fin);
  }

  query += ` ORDER BY fecha_evento DESC, horometro DESC`;

  const { rows } = await pool.query(query, values);
  return rows;
}

module.exports = {
  getHistorialUnificado
};