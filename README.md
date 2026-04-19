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

## Usar PostgreSQL local desde Codespaces

Si tu API corre en Codespaces y PostgreSQL corre en tu maquina local, `localhost` no apunta a tu PC, apunta al contenedor remoto.

La forma mas simple es crear un tunel inverso desde tu PC al Codespace.

1. En este repo ya quedo configurado `.env` para usar:

- `DB_HOST=127.0.0.1`
- `DB_PORT=15432`

2. En tu maquina local (donde corre PostgreSQL), abre una terminal y ejecuta:

```bash
gh auth login
gh codespace list
gh codespace ssh -c <NOMBRE_CODESPACE> -- -N -R 15432:localhost:5432
```

3. Deja esa terminal abierta (el tunel debe quedar activo).

4. En Codespaces, inicia la API:

```bash
npm run dev
```

Si necesitas usar otro puerto local de PostgreSQL, ajusta el valor final del tunel (`localhost:5432`) y `DB_PORT` en `.env`.

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