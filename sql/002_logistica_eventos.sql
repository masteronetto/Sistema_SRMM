CREATE TABLE IF NOT EXISTS logistica_eventos (
    id_evento BIGSERIAL PRIMARY KEY,
    titulo VARCHAR(160) NOT NULL,
    equipo VARCHAR(160) NOT NULL,
    cliente VARCHAR(160) NOT NULL,
    ruta VARCHAR(240) NOT NULL,
    hora_evento VARCHAR(40) NOT NULL,
    estado_evento VARCHAR(30) NOT NULL DEFAULT 'Pendiente',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_logistica_estado CHECK (estado_evento IN ('Pendiente', 'Confirmado', 'En Ruta', 'Completado', 'Cancelado'))
);

CREATE INDEX IF NOT EXISTS idx_logistica_eventos_created_at ON logistica_eventos (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logistica_eventos_estado ON logistica_eventos (estado_evento);