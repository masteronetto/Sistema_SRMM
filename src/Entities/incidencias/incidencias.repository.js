const pool = require('../../db/pool');

async function registrarIncidencia(id_maquina, id_usuario, descripcion, criticidad) {
    // existing helper previously placed in other file; keep simple wrapper if needed
    // This repo file is used by the incidencias controller for listing and registering.
    // For compatibility, leave registrarIncidencia to be required from the other module if needed.
    const queryAnalisis = `
        SELECT 
            m.horometro_actual,
            p.intervalo_horas,
            COALESCE(
                (SELECT horometro_registro FROM mantenimiento 
                 WHERE maquinaria_id_maquina = $1 
                 ORDER BY fecha_servicio DESC LIMIT 1), 
            0) as ultimo_mantenimiento
        FROM maquinaria m
        JOIN planes_mantencion p ON m.planes_mantencion_id_plan = p.id_plan
        WHERE m.id_maquina = $1
    `;
    const { rows } = await pool.query(queryAnalisis, [id_maquina]);
    const maquinaInfo = rows[0];
    const limiteSeguro = Number(maquinaInfo.ultimo_mantenimiento) + Number(maquinaInfo.intervalo_horas);
    const horasExcedidas = maquinaInfo.horometro_actual - limiteSeguro;
    let vinculada = 0;
    let advertencia = null;
    if (horasExcedidas > 0) {
        vinculada = 1;
        advertencia = `⚠️ Advertencia: Esta falla ocurrió ${horasExcedidas} horas después del mantenimiento vencido.`;
    }

    const insertQuery = `
        INSERT INTO incidencias_maquina 
        (maquinaria_id_maquina, usuarios_id_usuario, fecha, descripcion, criticidad, vinculada_mantenimiento, estado)
        VALUES ($1, $2, CURRENT_DATE, $3, $4, $5, 'Pendiente')
        RETURNING *
    `;
    const nueva = await pool.query(insertQuery, [id_maquina, id_usuario, descripcion, criticidad, vinculada]);
    return { incidencia: nueva.rows[0], mensaje_advertencia: advertencia };
}

async function listIncidencias({ maquinaria_ids = [], fecha_inicio = null, fecha_fin = null, criticidad = null, solo_no_resueltas = false } = {}) {
    const conditions = [];
    const values = [];
    let idx = 1;

    if (Array.isArray(maquinaria_ids) && maquinaria_ids.length > 0) {
        conditions.push(`i.maquinaria_id_maquina = ANY($${idx}::bigint[])`);
        values.push(maquinaria_ids.map((v) => Number(v)).filter((v) => Number.isFinite(v)));
        idx++;
    }
    if (fecha_inicio) {
        conditions.push(`i.fecha >= $${idx}`);
        values.push(fecha_inicio);
        idx++;
    }
    if (fecha_fin) {
        conditions.push(`i.fecha <= $${idx}`);
        values.push(fecha_fin);
        idx++;
    }
    if (criticidad) {
        conditions.push(`i.criticidad = $${idx}`);
        values.push(criticidad);
        idx++;
    }
    if (solo_no_resueltas) {
        conditions.push(`i.estado = 'Pendiente'`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
        SELECT
            i.id_incidencia,
            i.maquinaria_id_maquina,
            m.modelo_equipo,
            i.fecha,
            i.descripcion,
            i.criticidad,
            i.vinculada_mantenimiento,
            i.mantenimiento_id,
            i.estado,
            i.operador_id,
            u.nombre_completo as operador_nombre
        FROM incidencias_maquina i
        LEFT JOIN maquinaria m ON m.id_maquina = i.maquinaria_id_maquina
        LEFT JOIN usuarios u ON u.id_usuario = i.operador_id
        ${whereClause}
        ORDER BY i.fecha DESC, i.id_incidencia DESC
    `;

    const { rows } = await pool.query(query, values);
    return rows;
}

module.exports = {
    registrarIncidencia,
    listIncidencias
};
const pool = require('../../db/pool');

async function registrarIncidencia(id_maquina, id_usuario, descripcion, criticidad) {
    // 1. Obtener el horómetro actual y los datos de la última mantención de esta máquina
    const queryAnalisis = `
        SELECT 
            m.horometro_actual,
            p.intervalo_horas,
            COALESCE(
                (SELECT horometro_registro FROM mantenimiento 
                 WHERE maquinaria_id_maquina = $1 
                 ORDER BY fecha_servicio DESC LIMIT 1), 
            0) as ultimo_mantenimiento
        FROM maquinaria m
        JOIN planes_mantencion p ON m.planes_mantencion_id_plan = p.id_plan
        WHERE m.id_maquina = $1
    `;
    
    const { rows } = await pool.query(queryAnalisis, [id_maquina]);
    const maquinaInfo = rows[0];

    // Evaluar si la mantención estaba vencida antes de marcar la incidencia.
    const limiteSeguro = Number(maquinaInfo.ultimo_mantenimiento) + Number(maquinaInfo.intervalo_horas);
    const horasExcedidas = maquinaInfo.horometro_actual - limiteSeguro;
    
    let vinculada = 0; // 0 = Falla fortuita
    let advertencia = null;

    if (horasExcedidas > 0) {
        vinculada = 1; // 1 = Falla por negligencia/falta de mantención
        // Registrar advertencia automática para el operador.
        advertencia = `⚠️ Advertencia: Esta falla ocurrió ${horasExcedidas} horas después del mantenimiento vencido.`;
    }

    // Guardar la vinculación con mantenimiento cuando exista.
    const insertQuery = `
        INSERT INTO incidencias_maquina 
        (maquinaria_id_maquina, usuarios_id_usuario, fecha, descripcion, criticidad, vinculada_mantenimiento, estado)
        VALUES ($1, $2, CURRENT_DATE, $3, $4, $5, 'Pendiente')
        RETURNING *
    `;
    
    const nuevaIncidencia = await pool.query(insertQuery, [
        id_maquina, id_usuario, descripcion, criticidad, vinculada
    ]);

    return { 
        incidencia: nuevaIncidencia.rows[0],
        mensaje_advertencia: advertencia // El frontend leerá esto para mostrar la alerta roja
    };
}

module.exports = { registrarIncidencia };