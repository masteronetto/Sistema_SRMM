CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario BIGSERIAL PRIMARY KEY,
    nombre_completo VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL,
    rol_acceso VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_rol_acceso
        CHECK (rol_acceso IN ('Administrador', 'Mecanico', 'Operador', 'Cliente'))
);

CREATE TABLE IF NOT EXISTS maquinaria (
    id_maquina BIGSERIAL PRIMARY KEY,
    modelo_equipo VARCHAR(120) NOT NULL,
    horometro_actual NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (horometro_actual >= 0),
    estado VARCHAR(20) NOT NULL DEFAULT 'Disponible',
    especificaciones TEXT,
    planes_mantencion_id_plan BIGINT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_maquinaria_estado
        CHECK (estado IN ('Disponible', 'Arrendada', 'Mantencion', 'Bloqueada'))
);

CREATE TABLE IF NOT EXISTS historial_horometro (
    id_registro BIGSERIAL PRIMARY KEY,
    valor_horas NUMERIC(12,2) NOT NULL CHECK (valor_horas >= 0),
    fecha_registro DATE NOT NULL DEFAULT CURRENT_DATE,
    maquinaria_id_maquina BIGINT NOT NULL,
    arriendos_id_contrato BIGINT NULL,
    id_usuario BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_historial_maquinaria
        FOREIGN KEY (maquinaria_id_maquina)
        REFERENCES maquinaria (id_maquina)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_historial_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuarios (id_usuario)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_historial_horometro_maquina_fecha
ON historial_horometro (maquinaria_id_maquina, fecha_registro);

CREATE TABLE IF NOT EXISTS mantenimiento (
    id_mantencion BIGSERIAL PRIMARY KEY,
    tipo_servicio VARCHAR(60) NOT NULL,
    horometro_registro NUMERIC(12,2) NOT NULL CHECK (horometro_registro >= 0),
    detalle_tecnico TEXT NOT NULL,
    fecha_servicio DATE NOT NULL DEFAULT CURRENT_DATE,
    maquinaria_id_maquina BIGINT NOT NULL,
    usuarios_id_usuario BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_mantenimiento_maquinaria
        FOREIGN KEY (maquinaria_id_maquina)
        REFERENCES maquinaria (id_maquina)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_mantenimiento_usuario
        FOREIGN KEY (usuarios_id_usuario)
        REFERENCES usuarios (id_usuario)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_mantenimiento_maquina_fecha
ON mantenimiento (maquinaria_id_maquina, fecha_servicio);
