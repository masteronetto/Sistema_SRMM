# Sistema_SRMM

API base para SRMM usando Node.js, Express y PostgreSQL.

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
psql -U <usuario> -d <base_datos> -f sql/001_base_crud_usuarios.sql
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

### Historial de uso (horometro)

- `POST /api/historial-uso`
- `GET /api/historial-uso/maquina/:maquinaria_id_maquina`

Body ejemplo (POST):

```json
{
	"maquinaria_id_maquina": 1,
	"valor_horas": 1520.5,
	"id_usuario": 4,
	"arriendos_id_contrato": null,
	"fecha_registro": "2026-04-26T10:30:00Z"
}
```

Reglas implementadas:

- Cada registro se guarda con fecha/hora y usuario.
- El historial se consulta por maquina en orden cronologico.
- No se permite registrar un horometro menor al ultimo valor guardado para la misma maquina.
- Al registrar un nuevo horometro, el valor actual de la maquinaria queda sincronizado con el ultimo registro.

### Maquinaria

- `GET /api/maquinaria`
- `GET /api/maquinaria/:id_maquina`
- `POST /api/maquinaria`
- `PUT /api/maquinaria/:id_maquina`
- `DELETE /api/maquinaria/:id_maquina`

Body ejemplo (POST):

```json
{
	"modelo_equipo": "CAT 320D",
	"horometro_actual": 1245.5,
	"estado": "Disponible",
	"especificaciones": "Excavadora de orugas",
	"planes_mantencion_id_plan": null
}
```
Body ejemplo (PUT):

```json
{
	"modelo_equipo": "CAT 320D Actualizada",
	"horometro_actual": 1300,
	"estado": "Mantencion",
	"especificaciones": "Excavadora revisada",
	"planes_mantencion_id_plan": null
}
```
### Mantenimientos

- `POST /api/mantenimientos`
- `GET /api/mantenimientos/maquina/:maquinaria_id_maquina`

Body ejemplo (POST):

```json
{
	"tipo_servicio": "Preventivo",
	"horometro_registro": 1240,
	"detalle_tecnico": "Cambio de filtros y revision general",
	"fecha_servicio": "2026-04-27",
	"maquinaria_id_maquina": 1,
	"usuarios_id_usuario": 4
}
```

Reglas implementadas:

- El mantenimiento queda vinculado a maquinaria y usuario responsable.
- El registro es inmutable desde la API actual: solo existe alta y consulta.
- No se permite registrar un mantenimiento con horometro mayor al horometro_actual de la maquinaria.

## Pruebas en Postman

Servidor local para pruebas:

```bash
http://localhost:3000
```

## Actualizar el proyecto en Codespaces desde consola

Flujo rapido para guardar y subir cambios a GitHub desde tu Codespace:

```bash
git status              # Ver que cambio
git add .               # Agregar cambios
git commit -m "mensaje" # Comprometer cambios
git push origin main    # Subir a GitHub
```
