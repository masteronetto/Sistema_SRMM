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

    // 2. Subtarea 1: Evaluar si la mantención estaba vencida
    const limiteSeguro = Number(maquinaInfo.ultimo_mantenimiento) + Number(maquinaInfo.intervalo_horas);
    const horasExcedidas = maquinaInfo.horometro_actual - limiteSeguro;
    
    let vinculada = 0; // 0 = Falla fortuita
    let advertencia = null;

    if (horasExcedidas > 0) {
        vinculada = 1; // 1 = Falla por negligencia/falta de mantención
        // Subtarea 2: Mostrar advertencia automática
        advertencia = `⚠️ Advertencia: Esta falla ocurrió ${horasExcedidas} horas después del mantenimiento vencido.`;
    }

    // 3. Subtarea 4: Agregar campo vinculada_mantenimiento al registrar
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