const maquinariaRepo = require('../maquinaria/maquinaria.repository');
const arriendosRepo = require('./arriendos.repository');

async function createContrato(req, res, next) {
    try {
        const { maquinaria_id_maquina, cliente_id, fecha_inicio, fecha_fin, horometro_entrada, horometro_salida, estado_contrato } = req.body;

        const maquina = await maquinariaRepo.getMaquinariaById(maquinaria_id_maquina);
        
        if (!maquina) {
            return res.status(404).json({ message: 'Máquina no encontrada' });
        }

        // Validación de estado crítico
        if (['Mantencion', 'Bloqueada', 'No Operativa'].includes(maquina.estado)) {
            console.warn(`[AUDITORIA] Intento fallido de arriendo. Máquina ID ${maquina.id_maquina} en estado: ${maquina.estado}.`);

            // Sugerir alternativas
            return res.status(400).json({
                error: true,
                message: `Imposible crear contrato: La máquina se encuentra en estado "${maquina.estado}".`,
                estado_actual: maquina.estado,
                accion_requerida: maquina.estado === 'Bloqueada'
                    ? 'Requiere inspección técnica y desbloqueo por parte del administrador.'
                    : 'Requiere que el mecánico finalice la orden de trabajo activa.',
                alternativas_disponibles: []
            });
        }

        const contrato = await arriendosRepo.createArriendo({
            maquinaria_id_maquina,
            cliente_id: cliente_id || null,
            horometro_entrada: horometro_entrada ?? maquina.horometro_actual,
            horometro_salida: horometro_salida ?? null,
            fecha_inicio,
            fecha_fin,
            estado_contrato: estado_contrato || 'Activo'
        });

        return res.status(201).json({ message: 'Contrato creado exitosamente', contrato });

    } catch (error) {
        next(error);
    }
}

async function listContratos(req, res, next) {
    try {
        const rows = await arriendosRepo.listArriendos();
        return res.json(rows);
    } catch (error) {
        next(error);
    }
}

async function deleteContrato(req, res, next) {
    try {
        const id = Number(req.params.id_contrato);
        if (!Number.isFinite(id)) {
            return res.status(400).json({ message: 'id_contrato debe ser numerico' });
        }

        const deleted = await arriendosRepo.deleteArriendo(id);
        if (!deleted) {
            return res.status(404).json({ message: 'Contrato no encontrado' });
        }

        return res.status(204).send();
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createContrato,
    listContratos,
    deleteContrato
};