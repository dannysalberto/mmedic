# Feature Specification: Connection Pooling & Database Resilience for 1000 Concurrent Users

**Feature Branch**: `008-connection-pooling-optimization`

**Created**: 2026-09-24

**Status**: Draft

## Clarifications

### Session 2026-09-24

- Q: ¿Qué tamaño máximo de página debe imponer el wrapper como límite de paginación obligatorio? → A: Máximo 100 registros por página (estándar de la industria para apps empresariales).
- Q: ¿Qué debe hacer el sistema cuando el pool está completamente saturado y llega una nueva solicitud? → A: Encolar con timeout de 5 segundos; si no se obtiene conexión, retorna HTTP 503.

**Input**: User description: "Analizar el proyecto y su capacidad de soportar 1000 usuarios concurrentes. Implementar pool de conexiones y un wrapper centralizado que todas las funcionalidades usen para garantizar un funcionamiento óptimo. El proyecto será desplegado en Vercel y Supabase (y posiblemente Render). Se deben evitar problemas de límite de cursores, bloqueos y lentitud por conexiones mal manejadas que nunca se cerraron y que agoten el pool."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Operaciones simultáneas de alta concurrencia sin degradación (Priority: P1)

Durante un turno pico de una clínica con alta demanda, 50+ operadores (cajeros, médicos, personal administrativo) están usando simultáneamente MMedic: emitiendo facturas, consultando artículos, registrando pagos y gestionando pacientes. Todas las operaciones deben completarse sin errores de conexión, timeouts ni mensajes de "conexión agotada".

**Why this priority**: Es el escenario más crítico del negocio. Si el sistema no puede manejar operaciones concurrentes, la plataforma es inutilizable en un entorno clínico real.

**Independent Test**: Ejecutar una prueba de carga con 200 solicitudes simultáneas al API (mezcla de lecturas y escrituras) y verificar que el 99% de las respuestas llegan en menos de 2 segundos sin errores 500.

**Acceptance Scenarios**:

1. **Given** 50 usuarios autenticados operando concurrentemente en la plataforma, **When** cada uno realiza una operación de lectura o escritura, **Then** todas las respuestas llegan en menos de 2 segundos y ninguna falla por agotamiento de conexiones.
2. **Given** 200 solicitudes simultáneas al mismo endpoint de facturación, **When** se procesan en paralelo, **Then** no se produce error de "too many clients", "connection pool exhausted" ni "remaining connection slots are reserved".
3. **Given** una solicitud que falla por timeout en la base de datos, **When** el sistema intenta responder, **Then** la conexión se libera inmediatamente al pool y no queda "colgada", y las solicitudes subsiguientes se procesan normalmente.

---

### User Story 2 — Wrapper centralizado de acceso a datos con liberación automática de recursos (Priority: P1)

Todas las funcionalidades del backend (artículos, facturas, pacientes, colaboradores, categorías, entidades, usuarios, permisos, citas, pagos) deben pasar por un wrapper de acceso a datos único y centralizado que gestione automáticamente la adquisición, uso y liberación de conexiones del pool, garantizando que ninguna conexión quede abierta accidentalmente.

**Why this priority**: Un wrapper desacoplado evita que cada servicio gestione conexiones de forma independiente (fuente histórica de fugas de conexiones). Es el fundamento técnico de toda la optimización.

**Independent Test**: Verificar que cada servicio del sistema inyecta el wrapper centralizado y que ningún servicio tiene lógica propia de adquisición/liberación de conexiones. Ejecutar 500 operaciones con transacciones y verificar que el número de conexiones activas en el pool nunca excede el máximo configurado.

**Acceptance Scenarios**:

1. **Given** el wrapper centralizado configurado con un límite de pool de N conexiones, **When** N+10 solicitudes llegan simultáneamente, **Then** las solicitudes excedentes esperan en cola (no se abren conexiones extra) y se atienden cuando una conexión se libera.
2. **Given** una operación con transacción interactiva (`$transaction`), **When** la transacción se completa (commit) o falla (rollback), **Then** la conexión se devuelve al pool en menos de 50ms.
3. **Given** una excepción no controlada dentro de un servicio durante una consulta, **When** el error burbujea al filtro global, **Then** la conexión subyacente se libera automáticamente sin intervención manual.

---

### User Story 3 — Compatibilidad plena con Supabase PgBouncer y plataformas serverless (Priority: P1)

La plataforma debe funcionar correctamente cuando se despliega en entornos serverless (Vercel Functions para la Web, Render con autoscaling para la API) consumiendo PostgreSQL a través del connection pooler transaccional de Supabase (PgBouncer). Las transacciones preparadas, cursores declarados y operaciones que dependen de estado de sesión deben funcionar sin conflictos.

**Why this priority**: El despliegue en producción será sobre estas plataformas específicas. Sin compatibilidad con PgBouncer en modo transaccional, el sistema fallará en producción.

**Independent Test**: Desplegar el API en Render conectado a Supabase y ejecutar 100 transacciones `$transaction` concurrentes verificando que no se producen errores de tipo "prepared statement already exists" ni "cursor already exists".

**Acceptance Scenarios**:

1. **Given** la API desplegada en un entorno serverless con PgBouncer como intermediario, **When** se ejecutan transacciones interactivas Prisma (`$transaction`), **Then** no se producen errores de "prepared statement" duplicados ni conflictos de estado de sesión.
2. **Given** una nueva instancia cold-start de la API en serverless, **When** recibe su primera solicitud, **Then** la conexión al pool se establece en menos de 500ms y la respuesta se entrega en menos de 3 segundos (incluyendo el cold start).
3. **Given** la URL de conexión configurada con `pgbouncer=true` y `connection_limit=1` (pool del lado del cliente por instancia serverless), **When** múltiples instancias serverless están activas simultáneamente, **Then** las conexiones no se acumulan más allá del límite global de Supabase.

---

### User Story 4 — Monitoreo y observabilidad del estado del pool de conexiones (Priority: P2)

Los administradores del sistema deben poder consultar en cualquier momento el estado de salud del pool de conexiones: cuántas conexiones están activas, cuántas están inactivas, cuántas solicitudes están en cola y si hay fugas o conexiones estancadas.

**Why this priority**: Sin observabilidad, los problemas de pool se detectan cuando ya es demasiado tarde (el sistema ya dejó de responder). La prevención es crítica.

**Independent Test**: Consultar el endpoint de salud (`/api/v1/health`) y verificar que retorna métricas detalladas del pool.

**Acceptance Scenarios**:

1. **Given** la API en ejecución con el pool configurado, **When** un administrador consulta el endpoint de salud, **Then** la respuesta incluye: conexiones activas, conexiones inactivas, tamaño total del pool, solicitudes en espera y tiempo de espera promedio.
2. **Given** el sistema operando bajo carga alta (más de 100 solicitudes concurrentes), **When** el porcentaje de uso del pool supera el 80%, **Then** el sistema registra una advertencia en los logs del servidor.

---

### User Story 5 — Reintentos automáticos y resiliencia ante fallos transitorios de red (Priority: P2)

Ante problemas transitorios de conectividad con la base de datos (microinterrupciones de red entre Render/Vercel y Supabase, reinicios del pooler, failover de la base de datos), el sistema debe reintentar automáticamente las operaciones de lectura que fallen por desconexión temporal, sin que el usuario perciba la intermitencia.

**Why this priority**: Las desconexiones transitorias son inevitables en arquitecturas distribuidas cloud-to-cloud. Sin reintentos, cada microinterrupción produce errores visibles al usuario.

**Independent Test**: Simular una desconexión transitoria de 2 segundos y verificar que las operaciones de lectura se reintentan exitosamente y las de escritura emiten un error controlado sin dejar conexiones colgadas.

**Acceptance Scenarios**:

1. **Given** una consulta de lectura en ejecución, **When** ocurre un error de conexión transitorio (código `ECONNRESET`, `ETIMEDOUT`), **Then** el sistema reintenta la operación hasta 2 veces con backoff exponencial antes de fallar.
2. **Given** una transacción de escritura en ejecución, **When** ocurre un error de conexión transitorio, **Then** la transacción falla de manera controlada (no se reintenta para evitar efectos secundarios duplicados) y la conexión se devuelve al pool.

---

### Edge Cases

- ¿Qué sucede cuando Supabase PgBouncer alcanza su límite global de conexiones (ej. plan Free = 60 conexiones directas)?
  - Las solicitudes excedentes se encolan durante un máximo de 5 segundos esperando una conexión libre. Si no se obtiene conexión en ese plazo, se retorna un error HTTP 503 (Service Unavailable) con un mensaje claro indicando alta demanda, evitando timeouts silenciosos prolongados.
- ¿Qué pasa si una transacción interactiva (`$transaction`) se queda bloqueada esperando un lock de base de datos?
  - Debe existir un timeout de transacción (configurable, default 10 segundos) que aborte la transacción y devuelva la conexión al pool con un error explícito.
- ¿Qué ocurre durante un reinicio del pooler de Supabase (mantenimiento programado)?
  - El sistema debe detectar las conexiones muertas en el pool, descartarlas y crear nuevas, sin que el operador tenga que reiniciar la API manualmente.
- ¿Cómo se evita el "cursor leak" cuando Prisma ejecuta `findMany` con `take`/`skip` sobre conjuntos de datos muy grandes?
  - El wrapper impone un límite máximo obligatorio de 100 registros por consulta paginada. Cualquier `findMany` sin `take` o con `take > 100` será automáticamente limitado a 100 registros. Los cursores se cierran al finalizar la consulta.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE implementar un wrapper centralizado de acceso a datos (evolucionando el `PrismaService` existente) que gestione automáticamente la adquisición, uso y liberación de conexiones del pool para toda operación de base de datos.
- **FR-002**: El sistema DEBE configurar el pool de conexiones de Prisma Client con parámetros explícitos de: tamaño máximo del pool (`connection_limit`), timeout de conexión (`pool_timeout`), y timeout de transacción (`transaction_timeout`), todos ajustados para el despliegue en Supabase + PgBouncer.
- **FR-003**: El sistema DEBE garantizar que toda conexión utilizada en cualquier servicio (artículos, facturas, pacientes, etc.) se libere automáticamente al pool al finalizar la operación, ya sea por éxito, error o timeout.
- **FR-004**: El sistema DEBE funcionar correctamente con PgBouncer de Supabase en modo de pool transaccional, evitando el uso de prepared statements con nombre, cursores declarados persistentes y cualquier operación que requiera afinidad de sesión.
- **FR-005**: El sistema DEBE registrar métricas del pool de conexiones (activas, inactivas, en espera) en el endpoint de salud (`/health`) para facilitar la observabilidad.
- **FR-006**: El sistema DEBE implementar reintentos automáticos (con backoff exponencial, máximo 2 reintentos) para operaciones de lectura que fallen por errores de conexión transitorios.
- **FR-007**: El sistema DEBE aplicar un timeout configurable a las transacciones interactivas (`$transaction`) para evitar que una transacción bloqueada agote el pool indefinidamente.
- **FR-008**: El sistema DEBE emitir advertencias en los logs del servidor cuando el uso del pool supere el 80% de su capacidad configurada.
- **FR-009**: El sistema DEBE descartar automáticamente conexiones muertas o inválidas del pool (detección de conexiones "stale") y reemplazarlas sin intervención manual.
- **FR-010**: Todos los servicios existentes del backend (12 servicios: articles, categories, entities, contributors, customers, invoices, users, permissions, patients, appointments, auth, health) DEBEN seguir funcionando exactamente igual a través del wrapper sin cambios en su API pública.
- **FR-011**: El wrapper DEBE imponer un límite máximo obligatorio de 100 registros por página en toda operación de consulta paginada (`findMany`). Cualquier solicitud que exceda este límite será automáticamente recortada a 100 registros, previniendo fugas de cursores y consultas excesivamente grandes.
- **FR-012**: El wrapper DEBE encolar las solicitudes que lleguen cuando el pool esté saturado, esperando hasta un máximo de 5 segundos por una conexión libre. Si no se obtiene conexión en ese plazo, DEBE retornar un error HTTP 503 (Service Unavailable) con un mensaje descriptivo.

### Key Entities

- **Pool de Conexiones**: Conjunto finito y administrado de conexiones reutilizables hacia PostgreSQL. Atributos clave: tamaño máximo, timeout de adquisición, timeout de inactividad, conteo de uso.
- **Wrapper de Acceso a Datos**: Capa centralizada singleton que encapsula PrismaClient y gestiona su ciclo de vida, pool, métricas y políticas de reintento. Es la única puerta de acceso a la base de datos.
- **Métrica de Salud del Pool**: Instantánea del estado del pool en un punto en el tiempo. Incluye: conexiones activas, conexiones libres, solicitudes en cola, latencia promedio.
- **Configuración de Despliegue**: Conjunto de parámetros (variables de entorno) que adaptan el comportamiento del pool según la plataforma de despliegue (Render, Vercel, local).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El sistema soporta 1000 usuarios concurrentes simulados realizando operaciones mixtas (lectura/escritura) sin que más del 1% de las solicitudes fallen por errores de conexión.
- **SC-002**: El 95% de las solicitudes bajo carga de 500 usuarios concurrentes responden en menos de 2 segundos.
- **SC-003**: El número de conexiones activas simultáneas hacia PostgreSQL nunca excede el límite configurado en el pool, independientemente de la cantidad de solicitudes concurrentes.
- **SC-004**: Tras 10,000 operaciones consecutivas (lecturas y escrituras mixtas), no se detecta ninguna conexión "colgada" o filtrada fuera del pool (zero connection leaks).
- **SC-005**: Ante una desconexión transitoria de base de datos de hasta 5 segundos, el sistema se recupera automáticamente sin requerir reinicio manual de la API.
- **SC-006**: El endpoint de salud retorna métricas del pool en menos de 100ms sin consumir una conexión adicional del pool de datos.
- **SC-007**: En un despliegue serverless (Vercel/Render), el cold start de la API incluyendo el establecimiento de la primera conexión al pool se completa en menos de 3 segundos.
- **SC-008**: Los 12 servicios existentes del backend pasan todas sus pruebas funcionales existentes sin modificación de su interfaz pública tras la integración del wrapper.

## Assumptions

- La base de datos PostgreSQL está alojada en Supabase, que provee dos URLs de conexión: una para pool transaccional (PgBouncer, puerto 6543) y otra directa (puerto 5432 para migraciones).
- El plan actual de Supabase impone un límite de 60 conexiones directas a PostgreSQL; el pooler (PgBouncer) puede manejar cientos de conexiones clientes mapeándolas a ese límite.
- La API backend en NestJS se desplegará como un servicio long-running en Render (no serverless functions), lo cual permite mantener un pool persistente. La Web en Vercel usa la API en Render como backend, no accede directamente a la base de datos.
- Prisma ORM (versión actual del proyecto) soporta configuración de pool vía parámetros en la URL de conexión (`connection_limit`, `pool_timeout`) y a través del constructor de `PrismaClient`.
- La arquitectura Multi-Tenant por defecto del proyecto (filtros por `tenantId`) no se ve afectada por esta feature: el wrapper es agnóstico al tenant y opera a nivel de infraestructura de conexión.
- La app Android y la Web SPA no se conectan directamente a la base de datos; ambas consumen exclusivamente la API REST del backend.
