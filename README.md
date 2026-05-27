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

### Base de datos en Supabase

Si vas a usar PostgreSQL administrado en Supabase, el flujo recomendado es:

```bash
supabase login
supabase init
supabase link --project-ref zwsdcardcfxtjngxvsqw
```

Después debes tomar la cadena de conexión real desde Supabase Database Settings y ponerla en `DATABASE_URL` dentro de `.env` o en las variables de entorno del hosting.

Ejemplo:

```env
DATABASE_URL=postgresql://postgres:TU_PASSWORD_REAL@db.zwsdcardcfxtjngxvsqw.supabase.co:5432/postgres
DB_SSL=true
```

## Cambios recientes: Reportes de ingresos y migración de base de datos

Se añadió soporte para calcular y exportar reportes de ingresos generados por los arriendos de maquinaria. Cambios principales:

- Nueva columna en la tabla `maquinaria`: `tarifa_diaria NUMERIC(12,2)` (opcional). Si existe, la aplicación usará esta tarifa por máquina para calcular ingresos; si no, se usará el valor pasado en la query `?tarifa=` o la variable de entorno `ARRIENDO_RATE_DIA` (fallback 100000 CLP).
- El dashboard de administración de maquinaria permite crear y editar equipos con su tarifa diaria.
- La API de maquinaria quedó protegida por JWT; los usuarios autenticados pueden consultar, pero solo `Administrador` puede crear, editar, eliminar o cambiar tarifas.
- Nuevos endpoints:
  - `GET /api/reportes/ingresos?fecha_inicio=YYYY-MM-DD&fecha_fin=YYYY-MM-DD&tarifa=12345` -> devuelve JSON con `by_maquina` y `total_ingresos`.
  - `GET /api/reportes/ingresos/csv?fecha_inicio=YYYY-MM-DD&fecha_fin=YYYY-MM-DD&tarifa=12345` -> descarga CSV con detalle por máquina.

Ejemplo de uso (JSON):

```
GET /api/reportes/ingresos?fecha_inicio=2026-05-01&fecha_fin=2026-05-25

Response:
{
  "by_maquina": [
    { "id_maquina": 1, "modelo_equipo": "Excavadora X", "contratos": 2, "dias_arrendados": 15, "tarifa_usada": 100000, "ingresos": 1500000 },
    ...
  ],
  "total_ingresos": 3500000
}
```
Notas:
- La API calculará `ingresos = dias_arrendados * tarifa_usada` donde `tarifa_usada = COALESCE(maquinaria.tarifa_diaria, tarifa_query, process.env.ARRIENDO_RATE_DIA, 100000)`.
- También se añadió un endpoint CSV (`/api/reportes/ingresos/csv`) para descargar directamente el detalle por máquina.
- Para crear o modificar una maquinaria, usa el panel de administración en la vista de inventario del dashboard legacy; ahí puedes definir la tarifa diaria al alta o modificarla después.
- La vista React dedicada a maquinaria está en [frontend/scr/components/MaquinariaDashboard.jsx](frontend/scr/components/MaquinariaDashboard.jsx): muestra la lista para todos los roles y deshabilita la edición cuando el rol no es administrador.


### Recuperación de contraseña por correo

Para habilitar el envío real de correos desde `POST /api/auth/recover`, configura al menos estas variables en el hosting:

```env
SMTP_USER=tu_cuenta@gmail.com
SMTP_PASS=tu_app_password_de_gmail
SMTP_FROM=tu_cuenta@gmail.com
SMTP_GMAIL=true
FRONTEND_URL=https://tu-dominio
```

Si usas Gmail, necesitas una **App Password** con verificación en dos pasos activada.

Si ves `535-5.7.8 Username and Password not accepted`, no es un fallo de la API: Gmail está rechazando las credenciales. Debes usar la App Password, no tu contraseña normal.

Resumen de comandos usados para dejarlo funcionando:

```bash
npm install
vercel env add SMTP_GMAIL production
vercel env add SMTP_USER production
vercel env add SMTP_PASS production
vercel env add SMTP_FROM production
vercel env add FRONTEND_URL production
vercel --prod
```

Si prefieres hacerlo por API, los valores deben ser equivalentes a los anteriores y `FRONTEND_URL` debe apuntar a tu dominio real de producción.

La opción `DB_SSL=true` activa SSL para conexiones gestionadas. Si usas el entorno local, puedes seguir usando `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` y `DB_PASSWORD`.

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
├── public/                       # Frontend principal con UI completa
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
- **Sistema de incidencias y alertas operativas**
- **Registro de fallas por máquina con operador responsable**
- **Alertas automáticas para máquinas críticas**

## Flujo de Prueba de Roles

El registro público crea usuarios con rol `Usuario`. Luego, un `Administrador` puede cambiar el rol de cualquier usuario usando `PUT /api/usuarios/:id/role`.

### Secuencia recomendada para pruebas
Si estás en un Codespace de GitHub, entra a `Terminal > Puertos > Dirección de reenvío` y usa esa URL como base para las pruebas en Postman.

1. Registrar un nuevo usuario desde `POST /api/auth/register`.
2. Iniciar sesión con `POST /api/auth/login`.
3. Confirmar que el token JWT contiene `rol_acceso`.
4. Iniciar sesión con un usuario `Administrador`.
5. Cambiar el rol del usuario de prueba con `PUT /api/usuarios/:id/role`.
6. Volver a iniciar sesión y verificar que el token refleje el nuevo rol. 

### Usuarios de prueba sugeridos

```json
[
  {
    "nombre_completo": "Admin Inicial",
    "email": "admin@srmm.cl",
    "contrasena": "Admin123456",
    "rol_acceso": "Administrador"
  },
  {
    "nombre_completo": "Juan Usuario",
    "email": "juan.usuario@srmm.cl",
    "contrasena": "Juan123456",
    "rol_acceso": "Usuario"
  },
  {
    "nombre_completo": "Maria Operadora",
    "email": "maria.operadora@srmm.cl",
    "contrasena": "Maria123456",
    "rol_acceso": "Operador"
  },
  {
    "nombre_completo": "Pedro Mecánico",
    "email": "pedro.mecanico@srmm.cl",
    "contrasena": "Pedro123456",
    "rol_acceso": "Mecanico"
  }
]
```

### Qué debería ver cada rol

- `Usuario`: solo vista básica de bienvenida y opciones limitadas.
- `Operador`: acceso a maquinaria, mantenimientos y reportes.
- `Mecanico`: acceso a maquinaria, mantenimientos y reportes.
- `Administrador`: acceso total, incluyendo gestión de usuarios y cambio de roles.

## Flujo de Prueba de Roles

El registro público crea usuarios con rol `Usuario`. Luego, un `Administrador` puede cambiar el rol de cualquier usuario usando `PUT /api/usuarios/:id/role`.

### Secuencia recomendada para pruebas

1. Registrar un nuevo usuario desde `/api/auth/register`.
2. Iniciar sesión con `/api/auth/login`.
3. Confirmar que el token JWT contiene `rol_acceso`.
4. Iniciar sesión con un usuario `Administrador`.
5. Cambiar el rol del usuario de prueba con `PUT /api/usuarios/:id/role`.
6. Volver a iniciar sesión y verificar que el token refleje el nuevo rol.

### Usuarios de prueba sugeridos

```json
[
  {
    "nombre_completo": "Admin Inicial",
    "email": "admin@srmm.cl",
    "contrasena": "Admin123456",
    "rol_acceso": "Administrador"
  },
 
]
```
### Usuarios existentes para pruebas

| Nombre | Email | Contraseña | Rol |
| --- | --- | --- | --- |
| Admin Inicial | admin@srmm.cl | Admin123456 | Administrador |
| Daniel onetto | onettodaniel15@gmail.com | Daniel15 | Mecanico |

### Qué debería ver cada rol

- `Usuario`: solo vista básica de bienvenida y opciones limitadas.
- `Operador`: acceso a maquinaria, mantenimientos y reportes.
- `Mecanico`: acceso a maquinaria, mantenimientos y reportes.
- `Administrador`: acceso total, incluyendo gestión de usuarios y cambio de roles.

## Endpoints principales

Nuevas rutas relevantes añadidas recientemente:

- `GET /api/incidencias?maquina_ids=1,2&fecha_inicio=YYYY-MM-DD&fecha_fin=YYYY-MM-DD&criticidad=Alta&solo_no_resueltas=true`
  - Devuelve una lista detallada de incidencias que coinciden con los filtros. Cada registro incluye `id_incidencia`, `maquinaria_id_maquina`, `modelo_equipo`, `fecha`, `descripcion`, `criticidad`, `vinculada_mantenimiento`, `mantenimiento_id`, `estado`, `operador_id` y `operador_nombre`.

Notas sobre reportes de fallas:
- El endpoint `GET /api/reportes/fallas` devuelve ahora en `resumen` un campo adicional `porcentaje_vinculadas` (porcentaje de fallas vinculadas a mantenimiento vencido) y `total_vinculadas`.
- El frontend del dashboard muestra una interpretación automática: número de fallas vinculadas y porcentaje (por ejemplo, "3 de 10 fallas (30%) ocurrieron con mantenimiento vencido"). También hay una vista global de incidencias filtrable en el panel de reportes.

Tests:
- Se agregó un test mínimo en `tests/reportes.test.js` que valida el cálculo de porcentaje (`computePorcentajeVinculadas`). Ejecuta con:

```bash
npm test
```


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
- GET /api/maquinaria/:id_maquina/incidencias
- POST /api/maquinaria
- POST /api/maquinaria/:id_maquina/bloqueo-critico
- POST /api/maquinaria/:id_maquina/incidencias
- POST /api/maquinaria/:id_maquina/notify-operator
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

## Sistema de Incidencias y Alertas Operativas

### Alertas para máquinas críticas

Cuando un operador intenta seleccionar una máquina en estado "Bloqueada" o "No Operativa", el sistema muestra un modal de alerta que:

- Impide la confirmación de uso sin autorización administrativa
- Registra automáticamente la notificación al operador en el log del sistema
- Muestra el motivo del bloqueo y requiere confirmación antes de continuar

**Endpoint para notificar operador:**
- POST /api/maquinaria/:id_maquina/notify-operator

Ejemplo JSON:

```json
{
  "operador_id": 4,
  "motivo": "La máquina está bloqueada por seguridad y requiere autorización administrativa."
}
```

### Registro de incidencias

El administrador puede registrar fallas o incidencias inesperadas para mejorar la planificación operativa. Cada incidencia incluye:

- Fecha del evento
- Descripción detallada
- Nivel de criticidad (Alta/Media/Baja)
- Operador responsable
- Vinculación opcional a orden de mantenimiento existente

**Endpoints para incidencias:**
- GET /api/maquinaria/:id_maquina/incidencias
- POST /api/maquinaria/:id_maquina/incidencias

Parámetros de consulta para GET:
- `solo_no_resueltas=true`: Filtra solo incidencias con estado "Pendiente"

Ejemplo JSON para registrar incidencia:

```json
{
  "operador_id": 4,
  "fecha": "2026-05-14",
  "descripcion": "Falla hidráulica detectada durante operación en terreno",
  "criticidad": "Alta",
  "mantenimiento_id": null
}
```

### Comportamiento del sistema

- **Estado inicial**: Toda incidencia se registra con estado "Pendiente"
- **Vinculación**: Las incidencias pueden vincularse a órdenes de mantenimiento existentes o nuevas
- **Dashboard en tiempo real**: Al registrar una nueva incidencia, el contador de "Mantenimiento urgente" se actualiza automáticamente
- **Vista de detalle**: Los mecánicos pueden ver todas las incidencias por máquina con filtro para mostrar solo las no resueltas

### Estados de máquina críticos

- **Bloqueada**: Máquina con falla crítica que requiere intervención inmediata
- **No Operativa**: Máquina fuera de servicio por mantenimiento o revisión

Ambos estados activan alertas automáticas y requieren autorización administrativa para uso.

## Interfaz de Usuario

### Dashboard Principal

- **Vista general**: Estadísticas de disponibilidad, arriendos activos y alertas críticas
- **Actualización en tiempo real**: Contadores se actualizan automáticamente al registrar incidencias
- **Alertas visuales**: Indicadores de estado para máquinas críticas (Bloqueada/No Operativa)

### Gestión de Mantenimiento

- **Vista de máquinas**: Lista de equipos con indicadores de estado y prioridad
- **Panel de detalle**: Sección "Fallas e Incidencias" por máquina con:
  - Fecha, descripción y criticidad de cada incidencia
  - Operador responsable
  - Estado (Pendiente/Resuelta)
  - Vinculación a órdenes de mantenimiento
  - Filtro "Solo no resueltas"

### Formulario de Registro de Incidencias

- **Campos obligatorios**: Máquina, fecha, descripción, criticidad, operador responsable
- **Campo opcional**: Orden de mantenimiento existente para vinculación
- **Validación**: Verifica existencia de operador y orden de mantenimiento
- **Estado automático**: Todas las incidencias se registran como "Pendiente"

### Alertas Operativas

- **Modal de confirmación**: Aparece al seleccionar máquinas críticas
- **Registro automático**: Notifica al operador y registra en log del sistema
- **Prevención de uso**: Impide confirmación sin autorización administrativa

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

### Verificar retrasos en mantenimiento

```bash
curl -X POST http://localhost:3000/api/mantenimientos/ordenes/verificar-retrasos
```

Devuelve las órdenes vencidas y genera una notificación visual para el administrador con los días de atraso y el mecánico asignado.

### Obtener notificaciones pendientes

```bash
curl "http://localhost:3000/api/notificaciones-tiempo-real?solo_no_leidas=true"
```

### Registrar incidencia en máquina

```bash
curl -X POST http://localhost:3000/api/maquinaria/1/incidencias \
  -H 'Content-Type: application/json' \
  -d '{
    "operador_id": 4,
    "fecha": "2026-05-14",
    "descripcion": "Falla hidráulica detectada durante operación en terreno",
    "criticidad": "Alta",
    "mantenimiento_id": null
  }'
```

### Listar incidencias de una máquina

```bash
curl "http://localhost:3000/api/maquinaria/1/incidencias?solo_no_resueltas=true"
```

### Notificar operador sobre máquina crítica

```bash
curl -X POST http://localhost:3000/api/maquinaria/1/notify-operator \
  -H 'Content-Type: application/json' \
  -d '{
    "operador_id": 4
  }'
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

## Cambios recientes (25 May 2026)

Se integraron nuevas funcionalidades para el manejo del historial de horómetro y mantenciones:

- Backend:
  - Nuevo endpoint de búsqueda global: `GET /api/historial_uso/search` (parámetros: `q`, `fecha_from`, `fecha_to`, `id_usuario`, `page`, `per_page`).
  - `GET /api/historial_uso/maquina/:maquinaria_id_maquina` ahora soporta paginación y filtros (`page`, `per_page`, `order`, `fecha_from`, `fecha_to`, `id_usuario`).
  - Repositorio actualizado con funciones `listHistorialByMaquinaPaged` y `searchHistorial` en `src/Entities/historial_uso/historial_uso.repository.js`.
  - Controlador actualizado en `src/Entities/historial_uso/historial_uso.controller.js` para procesar query params y exponer `search`.

- Frontend:
  - Nuevo componente React `HistorialMantenciones` en `frontend/scr/components/HistorialMantenciones.jsx` con:
    - Paginación (10/25/50), orden asc/desc
    - Búsqueda por texto (`q`) y filtros por rango de fechas (`fecha_from`, `fecha_to`) e ID de usuario (`id_usuario`)
    - Soporta mostrar historial por `maquinaId` o usar búsqueda global

Cómo probar rápido:

1. Inicia el backend:

```bash
npm run dev
```

2. Ejemplos de llamadas:

```bash
curl "http://localhost:3000/api/historial_uso/maquina/123?page=1&per_page=10&order=desc"

curl "http://localhost:3000/api/historial_uso/search?q=excavadora&fecha_from=2026-05-01&fecha_to=2026-05-25&page=1&per_page=25"
```

3. Integración del componente React en la UI:

```jsx
import HistorialMantenciones from './components/HistorialMantenciones';

// Historial de una máquina concreta
<HistorialMantenciones maquinaId={123} />

// Búsqueda/paginación global
<HistorialMantenciones />
```

Próximos pasos recomendados:

- Integrar el componente en la página de detalle de máquina o en el dashboard.
- Mostrar nombre y rol del usuario en la tabla (hacer join con `usuarios`).
- Añadir opción de exportar CSV y enlaces a mantenciones relacionadas.

