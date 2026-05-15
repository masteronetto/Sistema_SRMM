const maquinariaRepo = require('../maquinaria/maquinaria.repository');
const pool = require('../../db/pool');

async function createContrato(req, res, next) {
    try {
        const { maquinaria_id_maquina, cliente_id, fecha_inicio, fecha_fin } = req.body;

        const maquina = await maquinariaRepo.getMaquinariaById(maquinaria_id_maquina);
        
        if (!maquina) {
            return res.status(404).json({ message: 'Máquina no encontrada' });
        }

        // Validación de estado crítico (Tarea 1)
        if (['Mantencion', 'Bloqueada'].includes(maquina.estado)) {
            console.warn(`[AUDITORIA] Intento fallido de arriendo. Máquina ID ${maquina.id_maquina} en estado: ${maquina.estado}.`);
            
            // Sugerir alternativas
            const alternativas = await pool.query(
                `SELECT id_maquina, modelo_equipo, horometro_actual FROM maquinaria 
                 WHERE modelo_equipo = $1 AND estado = 'Disponible' LIMIT 3`,
                [maquina.modelo_equipo]
            );

            return res.status(400).json({
                error: true,
                message: `Imposible crear contrato: La máquina se encuentra en estado "${maquina.estado}".`,
                estado_actual: maquina.estado,
                accion_requerida: maquina.estado === 'Bloqueada' 
                    ? 'Requiere inspección técnica y desbloqueo por parte del administrador.' 
                    : 'Requiere que el mecánico finalice la orden de trabajo activa.',
                alternativas_disponibles: alternativas.rows
            });
        }

        return res.status(201).json({ message: 'Contrato creado exitosamente' });

    } catch (error) {
        next(error);
    }
}

module.exports = {
    createContrato
};