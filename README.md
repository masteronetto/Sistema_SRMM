# Sistema_SRMM

API para gestión de maquinaria, mantenimiento, alertas y notificaciones en tiempo real usando Node.js, Express y PostgreSQL.

## Requisitos

- Node.js 18 o superior
- PostgreSQL 14 o superior

## Instalación

1. Instalar dependencias.

```bash
npm install
```

2. Crear el archivo de entorno.

```bash
cp .env.example .env
```

3. Cargar la base de datos del proyecto.

```bash
psql -U <usuario> -d <base_datos> -f <archivo_sql_base>
```

## Ejecución

```bash
npm run dev
```

Servidor local: http://localhost:3000

## Descripción general

El sistema expone endpoints para:

- Usuarios
- Maquinaria
- Historial de uso
- Alertas críticas
- Mantenimientos y órdenes de trabajo
- Planes de mantención
- Notificaciones en tiempo real

## Endpoints principales

### Health

- GET /health

### Usuarios

- GET /api/usuarios
- GET /api/usuarios/:id
- POST /api/usuarios
- PUT /api/usuarios/:id
- DELETE /api/usuarios/:id

Ejemplo JSON:

```json
{
  "nombre_completo": "Juan Perez",
  "email": "juan@srmm.cl",
  "contrasena": "123456",
  "rol_acceso": "Administrador"
}
```

### Maquinaria

- GET /api/maquinaria
- GET /api/maquinaria/:id_maquina
- GET /api/maquinaria/:id_maquina/horas-acumuladas
- GET /api/maquinaria/:id_maquina/bloqueo
- POST /api/maquinaria
- POST /api/maquinaria/:id_maquina/bloqueo-critico
- PUT /api/maquinaria/:id_maquina
- PATCH /api/maquinaria/:id_maquina/mark-not-operative
- PATCH /api/maquinaria/:id_maquina/desbloquear
- DELETE /api/maquinaria/:id_maquina

Ejemplo JSON para crear o actualizar:

```json
{
  "modelo_equipo": "CAT 320D",
  "horometro_actual": 1245.5,
  "estado": "Disponible",
  "especificaciones": "Excavadora de orugas",
  "planes_mantencion_id_plan": 1
}
```

Ejemplo JSON para bloqueo crítico:

```json
{
  "motivo_bloqueo": "Falla crítica en sistema hidráulico",
  "costo_estimado_reparacion": 15000.5
}
```

### Historial de uso

- POST /api/historial-uso
- POST /api/historial-uso/diario
- GET /api/historial-uso/maquina/:maquinaria_id_maquina

Ejemplo JSON:

```json
{
  "maquinaria_id_maquina": 1,
  "valor_horas": 1525,
  "id_usuario": 4,
  "arriendos_id_contrato": null,
  "fecha_registro": "2026-04-27"
}
```

Reglas principales:

- No se permite registrar un horometro menor al último valor de la máquina.
- No se permite duplicar el registro de una máquina en la misma fecha.
- Al registrar un nuevo horometro, la maquinaria se sincroniza con el último valor.

### Alertas críticas

- GET /api/alertas-criticas
- GET /api/alertas-criticas/:id_maquina/pendientes
- PATCH /api/alertas-criticas/:id_alerta/descartar
- PATCH /api/alertas-criticas/:id_alerta/resolver

Comportamiento automático:

- Si el horometro alcanza el 100% del umbral, se crea una alerta crítica.
- La máquina pasa a estado Bloqueada.
- Se registra el bloqueo crítico.
- Se genera notificación en tiempo real para administradores.

### Mantenimientos y órdenes de trabajo

- POST /api/mantenimientos
- GET /api/mantenimientos/maquina/:maquinaria_id_maquina
- POST /api/mantenimientos/programar
- GET /api/mantenimientos/ordenes/atrasadas
- POST /api/mantenimientos/ordenes/verificar-retrasos
- GET /api/mantenimientos/ordenes/maquina/:maquinaria_id_maquina
- GET /api/mantenimientos/ordenes/mecanico/:mecanico_id
- PATCH /api/mantenimientos/ordenes/:id_orden/iniciar

La verificación de retrasos también se ejecuta automáticamente al iniciar el servidor y luego en intervalos configurables.

Ejemplo JSON para mantenimiento:

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

Ejemplo JSON para orden programada:

```json
{
  "tipo_servicio": "Preventivo",
  "detalle_tecnico": "Cambio de filtros, aceite y revisión general",
  "fecha_programada": "2026-05-10",
  "maquinaria_id_maquina": 1,
  "mecanico_asignado": 4
}
```

### Planes de mantención

- GET /api/planes-mantencion
- GET /api/planes-mantencion/:id
- POST /api/planes-mantencion
- PUT /api/planes-mantencion/:id
- DELETE /api/planes-mantencion/:id
- POST /api/planes-mantencion/:id/asignar-maquina/:maquina_id
- DELETE /api/planes-mantencion/:id/desasignar-maquina/:maquina_id
- GET /api/planes-mantencion/maquina/:maquina_id

Ejemplo JSON:

```json
{
  "nombre_plan": "Servicio Preventivo 500h",
  "intervalo_horas": 500,
  "descripcion": "Cambio de aceite, filtros y revisión general cada 500 horas de uso"
}
```

### Notificaciones en tiempo real

- GET /api/notificaciones-tiempo-real
- PATCH /api/notificaciones-tiempo-real/:id/leida
- PATCH /api/notificaciones-tiempo-real/admin/leer-todas
- DELETE /api/notificaciones-tiempo-real/:id

Las notificaciones incluyen:

- Nombre de la máquina
- Prioridad
- Horas restantes

## Ejemplos de uso con curl

### Crear usuario

```bash
curl -X POST http://localhost:3000/api/usuarios \
  -H 'Content-Type: application/json' \
  -d '{
    "nombre_completo": "Juan Perez",
    "email": "juan@srmm.cl",
    "contrasena": "123456",
    "rol_acceso": "Administrador"
  }'
```

### Crear máquina

```bash
curl -X POST http://localhost:3000/api/maquinaria \
  -H 'Content-Type: application/json' \
  -d '{
    "modelo_equipo": "CAT 320D",
    "horometro_actual": 1245.5,
    "estado": "Disponible",
    "especificaciones": "Excavadora de orugas",
    "planes_mantencion_id_plan": 1
  }'
```

### Registrar horometro diario

```bash
curl -X POST http://localhost:3000/api/historial-uso/diario \
  -H 'Content-Type: application/json' \
  -d '{
    "maquinaria_id_maquina": 1,
    "valor_horas": 1525,
    "id_usuario": 4,
    "arriendos_id_contrato": null,
    "fecha_registro": "2026-04-27"
  }'
```

### Bloquear máquina crítica

```bash
curl -X POST http://localhost:3000/api/maquinaria/1/bloqueo-critico \
  -H 'Content-Type: application/json' \
  -d '{
    "motivo_bloqueo": "Falla crítica en sistema hidráulico",
    "costo_estimado_reparacion": 15000.5
  }'
```

### Crear plan de mantención

```bash
curl -X POST http://localhost:3000/api/planes-mantencion \
  -H 'Content-Type: application/json' \
  -d '{
    "nombre_plan": "Servicio Preventivo 500h",
    "intervalo_horas": 500,
    "descripcion": "Cambio de aceite, filtros y revisión general"
  }'
```

### Asignar plan a máquina

```bash
curl -X POST http://localhost:3000/api/planes-mantencion/1/asignar-maquina/5 \
  -H 'Content-Type: application/json'
```

### Programar mantenimiento

```bash
curl -X POST http://localhost:3000/api/mantenimientos/programar \
  -H 'Content-Type: application/json' \
  -d '{
    "tipo_servicio": "Preventivo",
    "detalle_tecnico": "Cambio de filtros, aceite y revisión general",
    "fecha_programada": "2026-05-10",
    "maquinaria_id_maquina": 1,
    "mecanico_asignado": 4
  }'
```

### Verificar retrasos en mantenimiento

```bash
curl -X POST http://localhost:3000/api/mantenimientos/ordenes/verificar-retrasos
```

Devuelve las órdenes vencidas y genera una notificación visual para el administrador con los días de atraso y el mecánico asignado.

### Obtener notificaciones pendientes

```bash
curl "http://localhost:3000/api/notificaciones-tiempo-real?solo_no_leidas=true"
```

## Pruebas en Postman

Base URL:

```bash
http://localhost:3000
```

Colección sugerida:

- Usuarios
- Maquinaria
- Historial de uso
- Alertas críticas
- Mantenimientos
- Planes de mantención
- Notificaciones

## Pruebas automatizadas

Se recomienda usar Jest y Supertest para validar endpoints críticos, especialmente:

- Registro de horometros
- Bloqueo crítico de máquinas
- Asignación de planes de mantención
- Programación de órdenes de trabajo
- Consulta de notificaciones

## Notas de uso

- El sistema ya incluye control de alertas, bloqueos, órdenes y notificaciones.
- Los planes de mantención se usan para calcular intervalos y prioridades.
- Si se requieren detalles de implementación, están en el código fuente.

## Codespaces

Flujo rápido para guardar cambios:

```bash
git status
git add .
git commit -m "Actualizar documentación"
git push origin main
```
