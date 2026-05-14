# Sistema_SRMM

API para gestión de maquinaria, mantenimiento, disponibilidad operativa, historial de mantenciones, alertas y notificaciones en tiempo real usando Node.js, Express y PostgreSQL.

## Requisitos

- Node.js 18 o superior
- Docker y Docker Compose instalados
- npm

## Instalación

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

El archivo `.env` ya contiene los valores preconfigurados para desarrollo:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=srmm
DB_USER=postgres
DB_PASSWORD=Daniel15
PORT=3000
```

### 3. Iniciar la base de datos con Docker

```bash
npm run db:start
```

Este comando:
- 🐳 Levanta PostgreSQL 15 en Docker
- 📊 Crea la BD `srmm` automáticamente
- 📋 Ejecuta los scripts SQL para crear tablas y vistas
- ✅ Verifica que todo esté funcionando correctamente

## Ejecución

### Iniciar el servidor de desarrollo

En otra terminal:

```bash
npm run dev
```

Deberías ver:
```
SRMM API escuchando en puerto 3000
WebSocket (Socket.IO) disponible en puerto 3000
Chequeo automático de retrasos cada 60000 ms
```

Servidor local: http://localhost:3000

## Comandos Disponibles

### Desarrollo
```bash
npm run dev                 # Inicia servidor con auto-reload
npm start                   # Inicia servidor normal
```

### Base de Datos
```bash
npm run db:start            # Iniciar PostgreSQL en Docker
npm run db:stop             # Detener PostgreSQL
npm run db:status           # Ver estado de contenedores
npm run db:logs             # Ver logs en tiempo real
npm run db:connect          # Conectar a la BD con psql
```

### Utilidades Adicionales
```bash
bash scripts/db-utils.sh              # Ver todos los comandos disponibles
bash scripts/db-utils.sh backup       # Hacer backup de la BD
bash scripts/db-utils.sh clean        # Limpiar datos (⚠️ irreversible)
bash scripts/db-utils.sh restart      # Reiniciar PostgreSQL
```

## Estructura de Directorios

```
Sistema_SRMM/
├── src/                          # Código del servidor
│   ├── Entities/                # Módulos (usuarios, maquinaria, etc.)
│   │   ├── usuarios/
│   │   ├── maquinaria/
│   │   ├── mantenimientos/
│   │   ├── planes_mantencion/
│   │   ├── alertas_criticas/
│   │   ├── notificaciones_tiempo_real/
│   │   ├── historial_uso/
│   │   └── reportes/
│   ├── config/                  # Configuración (env, socketio)
│   ├── db/                      # Pool de conexión a BD
│   ├── app.js                   # Configuración de Express
│   └── server.js                # Punto de entrada
├── frontend/                     # Frontend estático
│   └── index.html
├── sql/                          # Scripts de BD
│   ├── 001_base_crud_usuarios.sql
│   ├── vistas_reportes.sql
│   └── init-db.sh
├── scripts/                      # Scripts útiles
│   ├── start-db.sh
│   ├── restore-db.sh
│   └── db-utils.sh
├── .env                          # Variables de entorno (no versionar)
├── .env.example                  # Template de .env
├── docker-compose.yml            # Configuración Docker
├── package.json
└── README.md
```

## Solución de Problemas

### PostgreSQL no inicia

```bash
# Ver logs
npm run db:logs

# Limpiar y reintentar
docker-compose down -v
npm run db:start
```

### Error: "Port 5432 is already in use"

```bash
# Encontrar qué usa el puerto
lsof -i :5432

# O cambiar el puerto en docker-compose.yml
# Cambiar "5432:5432" a "5433:5432"
```

### Error: "Connection refused"

```bash
# Verificar que PostgreSQL está corriendo
npm run db:status

# Ver logs detallados
npm run db:logs

# Reiniciar
npm run db:stop
npm run db:start
```

### Error de autenticación: "password authentication failed"

Asegúrate que las credenciales en `.env` coinciden con `docker-compose.yml`:
- `DB_PASSWORD` en `.env` debe ser igual a `POSTGRES_PASSWORD` en `docker-compose.yml`

```bash
# Limpiar y reiniciar
docker-compose down -v
npm run db:start
```

### Recuperar base de datos desde backup

```bash
bash scripts/restore-db.sh sql/backup_produccion.sql
```

### Hacer backup de la base de datos

```bash
bash scripts/db-utils.sh backup
```

## Flujo Típico de Desarrollo

**Terminal 1: Base de datos**
```bash
npm run db:start
```

**Terminal 2: Servidor**
```bash
npm run dev
```

**Terminal 3: Tu editor/trabajo**
```bash
# VS Code u otro editor
code .
```

## Descripción General del Sistema

El sistema expone endpoints para:

- Usuarios
- Maquinaria
- Historial de uso
- Disponibilidad y bloqueos de maquinaria
- Alertas críticas
- Mantenimientos y órdenes de trabajo
- Historial detallado de mantenciones
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
- GET /api/maquinaria/:id_maquina/disponibilidad
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

La consulta de disponibilidad permite verificar si una máquina puede arrendarse antes de confirmar la operación. Devuelve el estado actual, el bloqueo activo si existe, las horas restantes hasta el próximo mantenimiento y si cumple con el margen mínimo de horas configurado. Por defecto, el margen es de 50 horas y puede ajustarse con el parámetro `margen_minimo_horas`.

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
- GET /api/mantenimientos/maquina/:maquinaria_id_maquina/historial
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

El historial de mantenciones por máquina permite filtrar por rango de fechas, tipo de servicio y paginación. La respuesta incluye el detalle técnico, fecha, horómetro, responsable y la máquina asociada para facilitar la trazabilidad operativa.

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
