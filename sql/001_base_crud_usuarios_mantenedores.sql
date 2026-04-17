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

CREATE TABLE IF NOT EXISTS mantenedores (
    id_mantenedor BIGSERIAL PRIMARY KEY,
    tipo VARCHAR(50) NOT NULL,
    codigo VARCHAR(50) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_mantenedores_tipo_codigo UNIQUE (tipo, codigo)
);

CREATE INDEX IF NOT EXISTS idx_mantenedores_tipo_activo
ON mantenedores (tipo, activo);
