# Sistema_SRMM

API base para SRMM con gestion de usuarios y mantenedores (CRUD) usando Node.js, Express y PostgreSQL.

## Requisitos

- Node.js 18+
- PostgreSQL 14+

## Configuracion

1. Instalar dependencias:

```bash
npm install
```

2. Crear archivo de entorno desde el ejemplo:

```bash
cp .env.example .env
```

3. Crear tablas base ejecutando:

```bash
psql -U <usuario> -d <base_datos> -f sql/001_base_crud_usuarios_mantenedores.sql
```

## Ejecucion

```bash
npm run dev
```

Servidor disponible en `http://localhost:3000`.

## Endpoints

### Health

- `GET /health`

### Usuarios

- `GET /api/usuarios`
- `GET /api/usuarios/:id`
- `POST /api/usuarios`
- `PUT /api/usuarios/:id`
- `DELETE /api/usuarios/:id`

Body ejemplo:

```json
{
	"nombre_completo": "Juan Perez",
	"email": "juan@srmm.cl",
	"contrasena": "123456",
	"rol_acceso": "Administrador"
}
```

### Mantenedores

- `GET /api/mantenedores`
- `GET /api/mantenedores/:id`
- `POST /api/mantenedores`
- `PUT /api/mantenedores/:id`
- `DELETE /api/mantenedores/:id`

Definicion actual en codigo:

- `mantenedores` es una entidad de catalogo parametrizable que almacena valores de referencia del sistema.
- Cada registro tiene estructura: `id_mantenedor`, `tipo`, `codigo`, `nombre`, `descripcion`, `activo`, `created_at`, `updated_at`.
- En creacion y actualizacion, los campos obligatorios son: `tipo`, `codigo` y `nombre`.
- `descripcion` es opcional y `activo` por defecto se guarda en `true`.
- Existe una restriccion unica por `tipo + codigo`, por lo que no se puede repetir el mismo codigo dentro del mismo tipo.
- El listado se entrega ordenado por `tipo` y luego por `codigo`.
- Comportamiento de respuestas: `400` por datos incompletos, `404` si no existe el recurso, `409` por duplicidad de `tipo + codigo`.

Body ejemplo:

```json
{
	"tipo": "estado_maquinaria",
	"codigo": "DISPONIBLE",
	"nombre": "Disponible",
	"descripcion": "Equipo disponible para arriendo",
	"activo": true
}
```