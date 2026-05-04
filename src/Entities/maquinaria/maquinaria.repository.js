const pool = require('../../db/pool');

const baseSelect = `
  SELECT id_maquina, modelo_equipo, horometro_actual, estado, especificaciones, planes_mantencion_id_plan, created_at, updated_at
  FROM maquinaria
`;

async function getHorasAcumuladasByMaquina(id_maquina) {
  const query = `
    SELECT
      m.id_maquina,
      m.modelo_equipo,
      m.estado,
      m.horometro_actual AS horas_acumuladas,
      m.especificaciones,
      m.created_at,
      m.updated_at,
      ultimo_historial.id_registro AS ultimo_registro_historial,
      ultimo_historial.valor_horas AS ultimo_valor_registrado,
      ultimo_historial.fecha_registro AS ultima_fecha_registro,
      COALESCE(conteo_historial.total_registros, 0) AS total_registros_historial
    FROM maquinaria m
    LEFT JOIN LATERAL (
      SELECT id_registro, valor_horas, fecha_registro
      FROM historial_horometro hh
      WHERE hh.maquinaria_id_maquina = m.id_maquina
      ORDER BY fecha_registro DESC, id_registro DESC
      LIMIT 1
    ) ultimo_historial ON TRUE
    LEFT JOIN LATERAL (
      SELECT COUNT(*)::BIGINT AS total_registros
      FROM historial_horometro hh
      WHERE hh.maquinaria_id_maquina = m.id_maquina
    ) conteo_historial ON TRUE
    WHERE m.id_maquina = $1
  `;

  const { rows } = await pool.query(query, [id_maquina]);
  return rows[0] || null;
}

async function listMaquinaria() {
  const query = `
    SELECT 
      m.id_maquina, 
      m.modelo_equipo, 
      m.horometro_actual, 
      m.estado, 
      m.especificaciones, 
      m.planes_mantencion_id_plan, 
      m.created_at, 
      m.updated_at,
      p.intervalo_horas,
      CASE
        WHEN p.intervalo_horas IS NULL THEN 'Baja'
        WHEN (COALESCE(um.horometro_registro, uh.ultimo_valor_registrado, 0) + p.intervalo_horas - m.horometro_actual) <= 0 THEN 'Alta'
        WHEN (COALESCE(um.horometro_registro, uh.ultimo_valor_registrado, 0) + p.intervalo_horas - m.horometro_actual) <= (p.intervalo_horas * 0.3) THEN 'Media'
        ELSE 'Baja'
      END AS prioridad
    FROM maquinaria m
    LEFT JOIN planes_mantencion p ON p.id_plan = m.planes_mantencion_id_plan
    LEFT JOIN LATERAL (
      SELECT horometro_registro 
      FROM mantenimiento 
      WHERE mantenimiento.maquinaria_id_maquina = m.id_maquina 
      ORDER BY fecha_servicio DESC, id_mantencion DESC 
      LIMIT 1
    ) um ON TRUE
    LEFT JOIN LATERAL (
      SELECT valor_horas AS ultimo_valor_registrado
      FROM historial_horometro hh
      WHERE hh.maquinaria_id_maquina = m.id_maquina
      ORDER BY fecha_registro DESC, id_registro DESC
      LIMIT 1
    ) uh ON TRUE
    ORDER BY 
      CASE 
        WHEN (COALESCE(um.horometro_registro, uh.ultimo_valor_registrado, 0) + COALESCE(p.intervalo_horas, 0) - m.horometro_actual) <= 0 THEN 1
        WHEN (COALESCE(um.horometro_registro, uh.ultimo_valor_registrado, 0) + COALESCE(p.intervalo_horas, 0) - m.horometro_actual) <= (COALESCE(p.intervalo_horas, 0) * 0.3) THEN 2
        ELSE 3
      END ASC,
      m.id_maquina ASC
  `;
  const { rows } = await pool.query(query);
  return rows;
}

async function listMaquinasConMantenimientoUrgente(umbralHoras = 0, limit = null, offset = null) {
  // umbralHoras: devuelve máquinas con horas_restantes <= umbralHoras
  // Calcula referencia_horometro: último mantenimiento.horometro_registro o último historial.valor_horas
  const query = `
    SELECT
      m.id_maquina,
      m.modelo_equipo,
      m.horometro_actual,
      m.estado,
      p.intervalo_horas,
      COALESCE(um.horometro_registro, uh.ultimo_valor_registrado, 0) AS referencia_horometro,
      (COALESCE(um.horometro_registro, uh.ultimo_valor_registrado, 0) + COALESCE(p.intervalo_horas, 0) - m.horometro_actual) AS horas_restantes,
      CASE
        WHEN (COALESCE(um.horometro_registro, uh.ultimo_valor_registrado, 0) + COALESCE(p.intervalo_horas, 0) - m.horometro_actual) <= 0 THEN 'Alta'
        WHEN (COALESCE(um.horometro_registro, uh.ultimo_valor_registrado, 0) + COALESCE(p.intervalo_horas, 0) - m.horometro_actual) <= COALESCE(p.intervalo_horas, 0) * 0.3 THEN 'Media'
        ELSE 'Baja'
      END AS prioridad
    FROM maquinaria m
    LEFT JOIN planes_mantencion p ON p.id_plan = m.planes_mantencion_id_plan
    LEFT JOIN LATERAL (
      SELECT horometro_registro
      FROM mantenimiento
      WHERE mantenimiento.maquinaria_id_maquina = m.id_maquina
      ORDER BY fecha_servicio DESC, id_mantencion DESC
      LIMIT 1
    ) um ON TRUE
    LEFT JOIN LATERAL (
      SELECT valor_horas AS ultimo_valor_registrado
      FROM historial_horometro hh
      WHERE hh.maquinaria_id_maquina = m.id_maquina
      ORDER BY fecha_registro DESC, id_registro DESC
      LIMIT 1
    ) uh ON TRUE
    WHERE p.intervalo_horas IS NOT NULL
      AND (COALESCE(um.horometro_registro, uh.ultimo_valor_registrado, 0) + COALESCE(p.intervalo_horas, 0) - m.horometro_actual) <= $1
    ORDER BY horas_restantes ASC
  `;

  const params = [umbralHoras];
  const { rows } = await pool.query(query, params);

  // apply limit/offset in JS if provided (keeps SQL simple and portable)
  let result = rows;
  if (offset !== null) {
    result = result.slice(offset);
  }
  if (limit !== null) {
    result = result.slice(0, limit);
  }

  return result;
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
  getHorasAcumuladasByMaquina,
  createMaquinaria,
  updateMaquinaria,
  updateHorometroActual,
  listMaquinasConMantenimientoUrgente,
  deleteMaquinaria
};
