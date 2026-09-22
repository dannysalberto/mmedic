# Research Document: Gestión de Usuarios, Roles, Permisos Especiales y Autenticación Multi-Tenant

**Feature**: [spec.md](./spec.md) | **Directory**: `specs/001-user-management-auth` | **Date**: 2026-09-20

---

## 1. Arquitectura Multi-Tenant y Aislamiento de Datos

### Decisión
Se implementa una arquitectura Multi-Tenant basada en **base de datos compartida con discriminador de inquilino (`tenantId`)** en cada entidad dependiente, respaldada por un middleware de resolución de contexto en NestJS y extensiones/filtros en Prisma ORM.

### Justificación
- **Alineación Constitucional**: Cumple estrictamente con la enmienda 2.4.0 de la Constitución ("Multi-Tenant nativo por defecto").
- **Eficiencia de Recursos y Alta Disponibilidad**: Permite operar múltiples clínicas e instituciones médicas sobre una única base de datos PostgreSQL alojada en **Supabase** (con pooler de conexiones y backups automáticos en la nube, y compatibilidad con Docker Compose local en desarrollo), facilitando migraciones atómicas centralizadas.
- **Seguridad Rigurosa**: El `tenantId` se extrae criptográficamente del token JWT en cada solicitud entrante (`TenantContext`), evitando que el cliente pueda inyectar o falsificar el inquilino en el cuerpo de la petición.
- **Régimen de Superadministrador**: Los usuarios con `ROL_SUPERADMIN` pueden operar con un inquilino maestro del sistema o especificar el inquilino objetivo mediante cabecera administrativa autenticada (`x-tenant-id`).

### Alternativas Evaluadas
- *Base de datos por inquilino*: Descartada por complejidad operacional excesiva en desarrollo local y sobrecarga en el pipeline de migraciones Prisma.
- *Esquema (Schema) por inquilino*: Descartada porque dificulta migraciones homogéneas y agrega fricción en el pool de conexiones de PostgreSQL.

---

## 2. Modelo de Autorización Híbrido: RBAC + PBAC (Permisos Especiales Dinámicos)

### Decisión
Se establece una matriz de autorización en dos niveles:
1. **Nivel 1 (RBAC)**: Rol base obligatorio por usuario (`ROL_SUPERADMIN`, `ROL_ADMIN`, `ROL_MEDICO`, `ROL_CAJERO`, `ROL_GERENCIA`), que otorga un conjunto de permisos implícitos inherentes a su función.
2. **Nivel 2 (PBAC - Permisos Especiales)**: Tabla relacional `user_special_permissions` vinculada a un catálogo extensible `special_permissions`. Permite asignar permisos atómicos a usuarios individuales para acciones de CRUD o de frontend.
3. **Mecanismo de Evaluación `verificarPermiso(userId, permissionCode)`**:
   - Retorna `true` si el permiso está contenido en los derechos inherentes del rol base del usuario **O** si el usuario tiene asignado explícitamente el permiso especial activo.
   - Retorna `false` en cualquier otro caso.

### Justificación
- Satisface directamente el requerimiento de negocio: un cajero (`ROL_CAJERO`) puede no tener permiso de anular facturas de forma general, pero a un cajero senior se le puede conceder el permiso especial `FACTURA_ANULAR`.
- Permite a la interfaz web consultar o verificar en memoria/servidor la combinación `(usuario, permiso)` para habilitar/deshabilitar controles como botones de acción con respuesta instantánea (< 50ms).

### Alternativas Evaluadas
- *Roles estáticos sin permisos individuales*: Rechazada porque obligaría a crear nuevos roles combinados (ej. `CAJERO_CON_ANULACION`) provocando proliferación incontrolada de roles (*role explosion*).
- *Permisos puramente individuales sin roles base*: Rechazada porque sobrecarga la administración diaria de usuarios estándar.

---

## 3. Autenticación Stateless con JWT y Cuenta Raíz Inicial

### Decisión
- **Mecanismo de Autenticación**: Tokens JWT firmados criptográficamente mediante clave simétrica (`JWT_SECRET`), con expiración configurable (ej. 8 horas para turnos médicos).
- **Cifrado de Contraseñas**: Uso de `bcrypt` con factor de costo 10 para garantizar resistencia ante ataques de fuerza bruta.
- **Cuenta Semilla Inicial**: Migración semilla reproducible (`prisma/seed.ts`) que crea la organización/tenant raíz (`default-clinic` / `Clinica Central MMedic`) y el usuario `superadmin` con la contraseña indicada por el usuario (`superadmin@123#`).

### Justificación
- Respeta la directiva constitucional 2.1 (Autenticación Stateless obligatoria vía JWT).
- Proporciona acceso inmediato desde el primer despliegue sin intervención manual en base de datos (cumpliendo con la directiva 1.5 de Cero Alteraciones Manuales).

---

## 4. Diseño Responsivo Mobile-First para Portal y Layout de Login (80% / 20%)

### Decisión
- **Layout de Login en Escritorio ($\ge$ 1024px)**: Grid CSS de dos columnas con proporción `4fr 1fr` (80% / 20%). Columna izquierda: Lienzo con identidad visual, ilustración médica y logotipo distintivo (`logo.svg`). Columna derecha: Formulario de inicio de sesión vertical, estilizado y compacto.
- **Adaptabilidad en Tablets (640px a 1023px)**: Proporción balanceada `1fr 1fr` o `60% / 40%` para mantener el formulario por encima de los 320px de ancho utilizable.
- **Adaptabilidad en Móviles (< 640px)**: Layout vertical apilado (`flex-col`). El logotipo institucional se ubica en la parte superior y el formulario ocupa el ancho completo con márgenes confortables, controles táctiles accesibles (mínimo 44px de altura) y cero desplazamiento horizontal.
- **Cabecera Horizontal Pública**: Barra fija o sticky superior con `logo.svg` a la izquierda y menú desplegable/accesible a la derecha con "Acerca de", "Contáctanos" y "Quiénes somos".

### Justificación
- Cumple con la directiva constitucional 5.3 ("Filosofía Mobile-First y Diseño Totalmente Adaptativo").
- Provee un contraste visual premium (WOW effect) preservando accesibilidad y ergonomía en teléfonos inteligentes.

---

## 5. Trazabilidad de Errores en Base de Datos y Migraciones

### Decisión
- **Tabla de Auditoría**: Se incorpora el modelo `SystemErrorLog` en PostgreSQL con los campos constitucionales obligatorios: `fileName`, `lineNumber`, `errorMessage`, `errorDescription`, `userId`, `timestamp`, `errorType`.
- **Filtro Global en NestJS**: Un `HttpExceptionFilter` global interceptará todas las excepciones en `apps/api`, registrará de manera asíncrona y no bloqueante en la tabla `SystemErrorLog` y devolverá la respuesta estandarizada `ApiResponse<T>`.
- **Migraciones Atómicas**: Toda la nueva estructura de datos (tablas `tenants`, actualización de `users`, `special_permissions`, `user_special_permissions`, `system_error_logs`) se generará mediante una migración versionada y formal con Prisma Migrate.

---

## 6. Resumen de Decisiones Técnicas

| Área | Decisión Seleccionada | Justificación Principal |
|---|---|---|
| **Multi-Tenancy** | Columna `tenantId` + Contexto JWT | Eficiencia operacional y aislamiento constitucional estricto. |
| **Control de Acceso** | RBAC (5 roles base) + PBAC (permisos dinámicos) | Flexibilidad granular sin explosión de roles. |
| **Verificación Permiso** | Función booleana evaluada en API y replicable en cliente | Habilitación instantánea de botones como "Anular Factura". |
| **UI Layout Login** | Mobile-First con split 80/20 en desktop ($\ge$1024px) | Cumplimiento estricto del requerimiento visual y responsividad. |
| **Persistencia Errores** | Tabla `system_error_logs` + Filter global | Auditoría y trazabilidad constitucional 1.4. |
