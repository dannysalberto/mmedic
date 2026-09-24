# Research & Technical Decisions: Módulo de Personal y Colaboradores Técnicos/Profesionales

## 1. Esquema de Base de Datos y Modelo `Contributor`

### Contexto y Decisión
- **Requerimiento del Usuario**: El personal técnico y profesional debe desacoplarse del catálogo de entidades institucionales (`entities`) y guardarse en su propia tabla dedicada denominada `contributors` (`model Contributor` en Prisma).
- **Aislamiento Multi-Tenant**: Cada registro contiene `tenantId` con clave foránea a `Tenant` (`onDelete: Cascade`), garantizando que los colaboradores pertenezcan estrictamente a la institución activa.
- **Campos del Modelo**:
  - `id`: UUID clave primaria.
  - `tenantId`: UUID foráneo.
  - `code`: Código único por tenant (ej. número de colegiatura médica, matrícula profesional o código interno: `MED-001`, `TEC-102`). Restricción `@@unique([tenantId, code])`.
  - `name`: Nombre completo del profesional o técnico (ej. `Dr. Roberto Mendoza`, `Lic. Andrea Silva`).
  - `status`: Estado operativo (`ACTIVE` / `INACTIVE`).
  - `createdAt`, `updatedAt`: Marcas de auditoría temporal.
  - Relación opcional/extensible con `ArticleParticipant` u orden médica para comisiones de servicios.
- **Alternativas Rechazadas**: Reutilizar la tabla `entities` con un campo discriminador (`type: ENTITY | CONTRIBUTOR`). Se rechazó porque el requerimiento explicitó la clonación a una tabla separada `contributors` para aislar la gestión del personal asistencial frente a entidades externas (mutuales, aseguradoras, clínicas aliadas).

---

## 2. Detección Inteligente de Duplicados en Personal Clínico

### Problema Específico
En la operativa diaria de una clínica, el personal técnico y médico suele ser ingresado con variantes de títulos o faltas ortográficas por recepcionistas o administrativos:
- `Dr. Carlos Alberto Gómez` vs `Carlos Gómez` vs `Dr. C. Gomez`
- `Lic. María Peña` vs `Maria Pena`

### Algoritmo de Normalización y Similitud
1. **Normalización Textual (`normalizeContributorName`)**:
   - Conversión a minúsculas (`toLowerCase()`).
   - Remoción de tildes y marcas diacríticas (`normalize("NFD").replace(/[\u0300-\u036f]/g, "")`).
   - Remoción de títulos y prefijos clínicos comunes: `dr`, `dra`, `doctor`, `doctora`, `lic`, `licenciado`, `licenciada`, `tec`, `tecnico`, `tecnica`, `esp`, `especialista`, `prof`, `profesor`, `enf`, `enfermero`, `enfermera`.
   - Limpieza de caracteres de puntuación, puntos y espacios redundantes.
2. **Cálculo de Similitud**:
   - Comparación de subcadenas y coeficiente de distancia (Levenshtein / similitud de bigramas) evaluando coincidencias $\ge 80\%$.
   - Agrupación por similitud y ordenamiento por puntaje de coincidencia.
   - Endpoint dedicado: `GET /api/v1/contributors/duplicates`.

---

## 3. Regla de Borrado Seguro (*Safe Deletion Logic*)

### Regla de Negocio
- Ningún profesional o técnico puede ser eliminado si posee asociaciones activas a artículos, consultas o registros asistenciales en la institución (`_count.associations > 0`).
- Si se detectan vínculos:
  - El backend retorna `400 Bad Request` indicando el número de registros vinculados y recomendando cambiar el estado a `INACTIVO`.
  - Se registra el intento y la excepción en la tabla de logs de base de datos (`SystemErrorLog`).
- Si no posee vínculos (`_count == 0`):
  - Se procede al borrado físico y se emite `200 OK` con notificación flotante de confirmación.

---

## 4. Fusión Atómica de Perfiles Duplicados (`POST /api/v1/contributors/merge`)

### Flujo de Transacción Atómica
1. Recepción de `primaryContributorId` (perfil maestro) y `secondaryContributorId` (perfil redundante a eliminar).
2. Verificación en BD de que ambos pertenezcan al mismo `tenantId`.
3. Ejecución de `$transaction` interactiva en Prisma:
   - Reasignar todas las participaciones/servicios del secundario al maestro.
   - Si existiese conflicto en la misma asignación, consolidar porcentajes sin superar el 100.00%.
   - Eliminar físicamente el registro `secondaryContributorId`.
4. Registro de log de auditoría del merge.
5. Retorno del perfil consolidado `ContributorWithStats`.

---

## 5. Integración con Navegación y Menú Principal

### Diagnóstico de UI
- En `apps/web/src/app/components/header/header.component.html`, la opción **"Personal/Profesionales"** dentro de la sección "PARTICIPANTES Y HONORARIOS" apuntaba provisionalmente a `/articles/new`.
- **Decisión**:
  - Enrutar el ítem del mega menú directamente a `/contributors`.
  - Crear la ruta `/contributors` en el router de Angular vinculada al componente de lista de colaboradores.
  - Replicar el ítem de menú en la navegación nativa de Android (`apps/android`).

---

## 6. Cumplimiento de la Constitución v2.6.0

- **Notificaciones Push Flotantes**: Todos los eventos de guardado, actualización, borrado y fusión emitirán toasts en Angular (`NotificationService`) y banners en Android (`NotificationManager`).
- **Retención de Navegación en Edición (5.4)**: Al actualizar un colaborador existente, la UI permanecerá en el formulario/modal para permitir revisiones sucesivas sin forzar redirección al listado. La redirección sólo ocurrirá al crear uno nuevo.
- **Límites de Código (LOC)**:
  - `ContributorsController`: $\le 80$ LOC (Tiny Controller delegando a servicio).
  - `ContributorsService` y componentes UI: $\le 300$ LOC con subcomponentes modulares.
- **Tipado Único en `@mmedic/types`**: Interfaces y contratos compartidos sin duplicación manual.
