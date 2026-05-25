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

// Ingresos por arriendos
async function getIngresosPorArriendos(fecha_inicio, fecha_fin, tarifa_diaria_fallback) {
  // fecha_inicio and fecha_fin are optional; tarifa_diaria_fallback is number (per day)
  const params = [];
  let where = '';
  let idx = 1;
  if (fecha_inicio) {
    where += ` AND a.fecha_inicio >= $${idx}`;
    params.push(fecha_inicio);
    idx++;
  }
  if (fecha_fin) {
    where += ` AND a.fecha_inicio <= $${idx}`;
    params.push(fecha_fin);
    idx++;
  }

  // always pass tarifa fallback as last param so we can COALESCE with m.tarifa_diaria
  params.push(tarifa_diaria_fallback || 0);
  const tarifaParamIdx = idx; // index of the tarifa fallback in the params array

  // dias = COALESCE(fecha_fin, CURRENT_DATE) - fecha_inicio
  const query = `
    SELECT
      a.maquinaria_id_maquina AS id_maquina,
      m.modelo_equipo,
      COUNT(*) AS contratos,
      SUM( (COALESCE(a.fecha_fin, CURRENT_DATE) - a.fecha_inicio) )::BIGINT AS dias_arrendados,
      COALESCE(m.tarifa_diaria, $${tarifaParamIdx})::NUMERIC(12,2) AS tarifa_usada,
      (SUM( (COALESCE(a.fecha_fin, CURRENT_DATE) - a.fecha_inicio) )::BIGINT * COALESCE(m.tarifa_diaria, $${tarifaParamIdx}) )::NUMERIC(14,2) AS ingresos
    FROM arriendos a
    LEFT JOIN maquinaria m ON m.id_maquina = a.maquinaria_id_maquina
    WHERE 1=1 ${where}
    GROUP BY a.maquinaria_id_maquina, m.modelo_equipo, m.tarifa_diaria
    ORDER BY dias_arrendados DESC
  `;

  const { rows } = await pool.query(query, params);

  // normalize numeric types
  const result = rows.map(r => ({
    id_maquina: r.id_maquina,
    modelo_equipo: r.modelo_equipo,
    contratos: Number(r.contratos || 0),
    dias_arrendados: Number(r.dias_arrendados || 0),
    tarifa_usada: Number(r.tarifa_usada || 0),
    ingresos: Number(r.ingresos || 0)
  }));

  const total = result.reduce((s, it) => s + (it.ingresos || 0), 0);

  return { by_maquina: result, total_ingresos: total };
}

module.exports.getIngresosPorArriendos = getIngresosPorArriendos;