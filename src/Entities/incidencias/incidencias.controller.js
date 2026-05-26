const incidenciasRepository = require('../repositories/incidencias.repository');

async function crearIncidencia(req, res) {
    try {
        const { id_maquina, id_usuario, descripcion, criticidad } = req.body;

        // Validación básica de seguridad de datos entrantes
        if (!id_maquina || !id_usuario || !descripcion || !criticidad) {
            return res.status(400).json({ error: 'Faltan campos obligatorios.' });
        }

        // Llamamos al repositorio que creamos en el paso anterior para procesar la regla del horómetro
        const resultado = await incidenciasRepository.registrarIncidencia(
            id_maquina, 
            id_usuario, 
            descripcion, 
            criticidad
        );

        // Devolvemos un código 201 (Creado) junto con la alerta si el mantenimiento estaba vencido
        return res.status(201).json({
            success: true,
            incidencia: resultado.incidencia,
            advertencia: resultado.mensaje_advertencia // El Frontend leerá esto para pintar la alerta roja
        });

    } catch (error) {
        console.error('Error en incidencias.controller:', error);
        return res.status(500).json({ error: 'Error interno del servidor al registrar la incidencia.' });
    }
}

module.exports = {
    crearIncidencia
};