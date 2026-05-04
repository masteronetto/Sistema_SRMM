## Sistema_SRMM

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
- `POST /api/historial-uso/diario`
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
- El ingreso diario valida formato `YYYY-MM-DD` cuando se envía `fecha_registro`.
- No se permite duplicar un registro de horometro para la misma maquina en la misma fecha.

Body ejemplo para ingreso diario:

```json
{
	"maquinaria_id_maquina": 1,
	"valor_horas": 1525,
	"id_usuario": 4,
	"arriendos_id_contrato": null,
	"fecha_registro": "2026-04-27"
}
```

### Maquinaria

- `GET /api/maquinaria`
- `GET /api/maquinaria/:id_maquina`
- `GET /api/maquinaria/:id_maquina/horas-acumuladas`
- `POST /api/maquinaria`
- `PUT /api/maquinaria/:id_maquina`
- `PATCH /api/maquinaria/:id_maquina/mark-not-operative`
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

**Marcar máquina como No Operativa:**

- `PATCH /api/maquinaria/:id_maquina/mark-not-operative`

Cambia el estado a `Bloqueada`. No requiere body.

Ejemplo:
```bash
PATCH http://localhost:3000/api/maquinaria/1/mark-not-operative
```

Respuesta:
```json
{
	"id_maquina": 1,
	"modelo_equipo": "CAT 320D",
	"horometro_actual": 1300,
	"estado": "Bloqueada",
	"especificaciones": "Excavadora de orugas",
	"planes_mantencion_id_plan": null,
	"created_at": "2026-04-27T10:00:00.000Z",
	"updated_at": "2026-04-27T11:30:00.000Z"
}
```

**Consultar horas acumuladas:**

- `GET /api/maquinaria/:id_maquina/horas-acumuladas`

Respuesta esperada:
```json
{
	"id_maquina": 1,
	"modelo_equipo": "CAT 320D",
	"estado": "Disponible",
	"horas_acumuladas": "1525.00",
	"especificaciones": "Excavadora de orugas",
	"created_at": "2026-04-27T10:00:00.000Z",
	"updated_at": "2026-04-27T11:30:00.000Z",
	"ultimo_registro_historial": 8,
	"ultimo_valor_registrado": "1525.00",
	"ultima_fecha_registro": "2026-04-27",
	"total_registros_historial": "12"
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

## Pruebas automatizadas (sugeridas)

Se sugiere usar `jest` + `supertest` para pruebas unitarias e integración de endpoints.

1) Instalar dependencias de desarrollo:

```bash
npm install --save-dev jest supertest
```

2) Añadir script en `package.json` (sección `scripts`):

```json
"scripts": {
	"dev": "node src/server.js",
	"test": "jest --runInBand"
}
```

3) Estructura de tests recomendada:

- `tests/maquinaria.urgent.test.js` — tests para `GET /api/maquinaria/urgent-maintenance`.
- `tests/historial.integracion.test.js` — tests de integración para validación de arriendos y `historial-uso`.

4) Ejemplo de test con `supertest` (archivo: `tests/maquinaria.urgent.test.js`):

```javascript
const request = require('supertest');
const app = require('../src/app'); // exporta tu app Express desde src/app.js

describe('GET /api/maquinaria/urgent-maintenance', () => {
	test('responde 200 y devuelve lista con esquema esperado', async () => {
		const res = await request(app).get('/api/maquinaria/urgent-maintenance?umbral=50');
		expect(res.statusCode).toBe(200);
		expect(Array.isArray(res.body)).toBe(true);
		if (res.body.length > 0) {
			const item = res.body[0];
			expect(item).toHaveProperty('id_maquina');
			expect(item).toHaveProperty('modelo_equipo');
			expect(item).toHaveProperty('horas_restantes');
		}
	});
});
```

5) Ejecutar tests:

```bash
npm test
```

Nota: estos tests son sugeridos; el repositorio actual no incluye tests automáticos por defecto.

## Funciones añadidas y cómo probarlas

1) Listar máquinas con mantenimiento urgente

- Ruta: `GET /api/maquinaria/urgent-maintenance`
- Query params opcionales: `umbral` (número de horas), `limit`, `offset`.
- Descripción: devuelve máquinas cuyo cálculo de `horas_restantes` <= `umbral`. El cálculo usa la última referencia conocida (último `mantenimiento.horometro_registro` o último `historial_horometro.valor_horas`) y el `intervalo_horas` del plan de mantención.
- Ejemplo curl:

```bash
curl -s "http://localhost:3000/api/maquinaria/urgent-maintenance?umbral=0" | jq
```

- Respuesta esperada (ejemplo):

```json
[
	{
		"id_maquina": 1,
		"modelo_equipo": "CAT 320D",
		"horometro_actual": 1525,
		"estado": "Disponible",
		"intervalo_horas": 250,
		"referencia_horometro": 1300,
		"horas_restantes": 25,
		"prioridad": "Alta"
	}
]
```

2) Validación de integridad de telemetría al registrar historial de uso

- Endpoint: `POST /api/historial-uso` (ya existente)
- Comportamiento añadido: si se envía `arriendos_id_contrato`, el servidor valida que el `valor_horas` (horometro de retorno) sea mayor o igual que el `horometro_salida` registrado en la tabla de `arriendos`. Si es menor, la petición falla con `400`.
- Ejemplo curl (registro válido):

```bash
curl -X POST http://localhost:3000/api/historial-uso \
	-H 'Content-Type: application/json' \
	-d '{"maquinaria_id_maquina":1,"valor_horas":1600,"id_usuario":4,"arriendos_id_contrato":10}'
```

Ejemplo de respuesta en caso de dato inválido (horometro retorno menor que salida del contrato):

```json
{ "message": "valor_horas (retorno) no puede ser menor que horometro_salida del contrato de arriendo" }
```

3) Observaciones adicionales

- Se añadió documentación técnica en `docs/SRS_extensiones.md` con criterios de aceptación y subtareas.
- La API actual incluye `POST /api/mantenimientos` para registrar mantenimientos; si se desea el flujo de "finalizar y desbloquear" automática, hay una propuesta en el SRS pero la acción de finalizar debe implementarse explícitamente.


## Actualizar el proyecto en Codespaces desde consola

Flujo rapido para guardar y subir cambios a GitHub desde tu Codespace:

```bash
git status              # Ver que cambio
git add .               # Agregar cambios
git commit -m "mensaje" # Comprometer cambios
git push origin main    # Subir a GitHub
```


- Backend (implementación mínima):
  - `src/Entities/maquinaria/maquinaria.repository.js`: función `listMaquinasConMantenimientoUrgente(umbral, limit, offset)`.
  - `src/Entities/maquinaria/maquinaria.controller.js`: handler `listUrgentMaintenance`.
  - `src/Entities/maquinaria/maquinaria.routes.js`: ruta `GET /api/maquinaria/urgent-maintenance`.
  - `src/Entities/historial_uso/historial_uso.controller.js`: validación de integridad telemetría para registros con `arriendos_id_contrato`.

