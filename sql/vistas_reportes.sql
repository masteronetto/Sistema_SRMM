CREATE OR REPLACE VIEW vista_historial_completo AS
SELECT 
    h.maquinaria_id_maquina,
    'Uso Diario' AS tipo_evento,
    h.valor_horas AS horometro,
    h.fecha_registro AS fecha_evento,
    u.nombre_completo AS usuario_responsable,
    'Registro de horas' AS detalle,
    h.created_at AS fecha_sistema  -- Agregado para ordenamiento más preciso
FROM historial_horometro h
JOIN usuarios u ON h.id_usuario = u.id_usuario

UNION ALL

SELECT 
    m.maquinaria_id_maquina,
    'Mantención: ' || m.tipo_servicio AS tipo_evento,
    m.horometro_registro AS horometro,
    m.fecha_servicio AS fecha_evento,
    u.nombre_completo AS usuario_responsable,
    m.detalle_tecnico AS detalle,
    m.created_at AS fecha_sistema
FROM mantenimiento m
JOIN usuarios u ON m.usuarios_id_usuario = u.id_usuario
ORDER BY fecha_evento DESC, fecha_sistema DESC;