const pool = require('../../db/pool');

function computePorcentajeVinculadas(totalVinculadas, totalFallas) {
  const vinc = Number(totalVinculadas || 0);
  const tot = Number(totalFallas || 0);
  if (!tot || tot === 0) return 0;
  return Number(((vinc / tot) * 100).toFixed(2));
}

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

function buildReporteFallasFilters({ maquinaria_ids = [], fecha_inicio = null, fecha_fin = null, criticidad = null } = {}) {
  const conditions = [];
  const values = [];
  let paramIndex = 0;

  if (Array.isArray(maquinaria_ids) && maquinaria_ids.length > 0) {
    paramIndex += 1;
    conditions.push(`i.maquinaria_id_maquina = ANY($${paramIndex}::bigint[])`);
    values.push(maquinaria_ids.map((item) => Number(item)).filter((item) => Number.isFinite(item)));
  }

  if (fecha_inicio) {
    paramIndex += 1;
    conditions.push(`i.fecha >= $${paramIndex}`);
    values.push(fecha_inicio);
  }

  if (fecha_fin) {
    paramIndex += 1;
    conditions.push(`i.fecha <= $${paramIndex}`);
    values.push(fecha_fin);
  }

  if (criticidad) {
    paramIndex += 1;
    conditions.push(`i.criticidad = $${paramIndex}`);
    values.push(criticidad);
  }

  return {
    whereClause: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
    values
  };
}

function getReporteFallasPeriodoExpr(periodo = 'mensual') {
  const normalized = String(periodo || 'mensual').toLowerCase();

  if (normalized === 'semanal') {
    return `date_trunc('week', i.fecha)::date`;
  }

  if (normalized === 'trimestral') {
    return `date_trunc('quarter', i.fecha)::date`;
  }

  if (normalized === 'personalizado') {
    return `i.fecha::date`;
  }

  return `date_trunc('month', i.fecha)::date`;
}

async function getReporteFallas(filtros = {}) {
  const {
    periodo = 'mensual',
    maquinaria_ids = [],
    fecha_inicio = null,
    fecha_fin = null,
    criticidad = null,
    mostrar_advertencia = false
  } = filtros;

  const { whereClause, values } = buildReporteFallasFilters({ maquinaria_ids, fecha_inicio, fecha_fin, criticidad });
  const periodoExpr = getReporteFallasPeriodoExpr(periodo);

  const groupedQuery = `
    SELECT
      i.maquinaria_id_maquina,
      m.modelo_equipo,
      i.criticidad,
      ${periodoExpr} AS periodo_bucket,
      COUNT(*)::int AS total_fallas,
      COUNT(*) FILTER (WHERE i.estado = 'Resuelta')::int AS total_resueltas,
      COUNT(*) FILTER (WHERE i.estado = 'Pendiente')::int AS total_pendientes,
      COUNT(*) FILTER (WHERE COALESCE(i.vinculada_mantenimiento, 0) = 1)::int AS total_vinculadas,
      ROUND(COALESCE(AVG(CASE WHEN i.estado = 'Resuelta' THEN EXTRACT(EPOCH FROM (i.updated_at - i.created_at)) / 3600.0 END), 0)::numeric, 2) AS promedio_resolucion_horas
    FROM incidencias_maquina i
    INNER JOIN maquinaria m ON m.id_maquina = i.maquinaria_id_maquina
    ${whereClause}
    GROUP BY 1, 2, 3, 4
    ORDER BY periodo_bucket DESC, total_fallas DESC, m.modelo_equipo ASC, i.criticidad ASC
  `;

  const summaryQuery = `
    SELECT
      COUNT(*)::int AS total_fallas,
      COUNT(*) FILTER (WHERE i.estado = 'Resuelta')::int AS total_resueltas,
      COUNT(*) FILTER (WHERE i.estado = 'Pendiente')::int AS total_pendientes,
      COUNT(*) FILTER (WHERE COALESCE(i.vinculada_mantenimiento, 0) = 1)::int AS total_vinculadas,
      ROUND(COALESCE(AVG(CASE WHEN i.estado = 'Resuelta' THEN EXTRACT(EPOCH FROM (i.updated_at - i.created_at)) / 3600.0 END), 0)::numeric, 2) AS promedio_resolucion_horas
    FROM incidencias_maquina i
    ${whereClause}
  `;

  const [groupedResult, summaryResult] = await Promise.all([
    pool.query(groupedQuery, values),
    pool.query(summaryQuery, values)
  ]);

  const rows = groupedResult.rows.map((row) => ({
    maquinaria_id_maquina: Number(row.maquinaria_id_maquina),
    modelo_equipo: row.modelo_equipo,
    criticidad: row.criticidad,
    periodo_bucket: row.periodo_bucket,
    total_fallas: Number(row.total_fallas || 0),
    total_resueltas: Number(row.total_resueltas || 0),
    total_pendientes: Number(row.total_pendientes || 0),
    total_vinculadas: Number(row.total_vinculadas || 0),
    promedio_resolucion_horas: Number(row.promedio_resolucion_horas || 0)
  }));

  const totalFallas = Number(summaryResult.rows[0]?.total_fallas || 0);
  const totalResueltas = Number(summaryResult.rows[0]?.total_resueltas || 0);
  const totalPendientes = Number(summaryResult.rows[0]?.total_pendientes || 0);
  const promedioResolucionHoras = Number(summaryResult.rows[0]?.promedio_resolucion_horas || 0);

  const porCriticidadMap = new Map();
  const porMaquinaMap = new Map();
  const porPeriodoMap = new Map();

  rows.forEach((row) => {
    porCriticidadMap.set(row.criticidad, (porCriticidadMap.get(row.criticidad) || 0) + row.total_fallas);
    porMaquinaMap.set(row.maquinaria_id_maquina, {
      maquinaria_id_maquina: row.maquinaria_id_maquina,
      modelo_equipo: row.modelo_equipo,
      total_fallas: (porMaquinaMap.get(row.maquinaria_id_maquina)?.total_fallas || 0) + row.total_fallas
    });
    const periodKey = row.periodo_bucket ? String(row.periodo_bucket).slice(0, 10) : 'Sin periodo';
    porPeriodoMap.set(periodKey, (porPeriodoMap.get(periodKey) || 0) + row.total_fallas);
  });

  const maquinaConMasFallas = Array.from(porMaquinaMap.values()).sort((a, b) => b.total_fallas - a.total_fallas)[0] || null;

  return {
    filtros: {
      periodo,
      maquinaria_ids: Array.isArray(maquinaria_ids) ? maquinaria_ids.map((item) => Number(item)).filter((item) => Number.isFinite(item)) : [],
      fecha_inicio,
      fecha_fin,
      criticidad
    },
    resumen: {
      total_fallas: totalFallas,
      total_resueltas: totalResueltas,
      total_pendientes: totalPendientes,
      total_vinculadas: Number(summaryResult.rows[0]?.total_vinculadas || 0),
      porcentaje_vinculadas: computePorcentajeVinculadas(Number(summaryResult.rows[0]?.total_vinculadas || 0), Number(summaryResult.rows[0]?.total_fallas || 0)),
      promedio_resolucion_horas: promedioResolucionHoras,
      maquina_con_mas_fallas: maquinaConMasFallas,
      por_criticidad: Array.from(porCriticidadMap.entries()).map(([label, total]) => ({ label, total })).sort((a, b) => b.total - a.total),
      por_periodo: Array.from(porPeriodoMap.entries()).map(([label, total]) => ({ label, total })).sort((a, b) => new Date(b.label) - new Date(a.label))
    },
    agrupados: rows
  };
}

module.exports = {
  getHistorialUnificado,
  getTopMaquinas,
  getEstadisticas,
  getUsoHistorico,
  getReporteFallas
};

module.exports.computePorcentajeVinculadas = computePorcentajeVinculadas;

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