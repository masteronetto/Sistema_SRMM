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

// Subtarea D: Top Máquinas
async function getTopMaquinas() {
  const query = `
    SELECT id_maquina, modelo_equipo, horometro_actual 
    FROM maquinaria 
    ORDER BY horometro_actual DESC 
    LIMIT 5
  `;
  const { rows } = await pool.query(query);
  return rows;
}

// Subtareas B y C: Estadísticas de mantenciones vs fallas
async function getEstadisticas() {
  const query = `
    SELECT 
      m.id_maquina, 
      m.modelo_equipo, 
      m.horometro_actual,
      COUNT(DISTINCT man.id_mantencion) AS total_mantenciones,
      COUNT(DISTINCT inc.id_incidencia) AS total_fallas,
      CASE 
        WHEN COUNT(DISTINCT man.id_mantencion) = 0 THEN 0
        ELSE ROUND(m.horometro_actual / COUNT(DISTINCT man.id_mantencion), 2) 
      END as promedio_horas_entre_mantenciones
    FROM maquinaria m
    LEFT JOIN mantenimiento man ON m.id_maquina = man.maquinaria_id_maquina
    LEFT JOIN incidencias_maquina inc ON m.id_maquina = inc.maquinaria_id_maquina
    GROUP BY m.id_maquina, m.modelo_equipo, m.horometro_actual
    ORDER BY total_fallas DESC, total_mantenciones DESC
  `;
  const { rows } = await pool.query(query);
  return rows;
}

// Subtarea A: Historial para el gráfico
async function getUsoHistorico(id_maquina) {
  const query = `
    SELECT fecha_registro, valor_horas 
    FROM historial_horometro 
    WHERE maquinaria_id_maquina = $1 
    ORDER BY fecha_registro ASC
  `;
  const { rows } = await pool.query(query, [id_maquina]);
  return rows;
}

module.exports = {
  getHistorialUnificado,
  getTopMaquinas,
  getEstadisticas,
  getUsoHistorico
};