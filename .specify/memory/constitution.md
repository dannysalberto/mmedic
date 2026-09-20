<!--
Sync Impact Report
- Version change: Initial Scaffold -> 1.0.0
- Ratification Date: 2026-09-20
- Last Amended Date: 2026-09-20
- Modified Principles:
  * Principle I: Stack Tecnológico Unificado y Monorepo
  * Principle II: Autenticación Obligatoria JWT (Stateless & Secure)
  * Principle III: Autorización Híbrida (Roles RBAC + Permisos Granulares Adicionales)
  * Principle IV: Preservación Estricta de Principios SOLID
  * Principle V: Servicios Transversales y Contratos Multiplataforma (Web & Android)
- Added Sections:
  * Estándares de Seguridad y Protección de Datos Médicos (HIPAA/GDPR Ready)
  * Flujo de Desarrollo y Quality Gates (Spec-Driven Development)
- Removed Sections: Template placeholders
- Deferred Items / TODOs: None
-->

# MMedic Platform Constitution

La presente constitución establece los principios arquitectónicos, directrices de seguridad, diseño de software y estándares de ingeniería no negociables para el ecosistema **MMedic**. Aplica a todas las aplicaciones del monorepo: Frontend Web, Backend API y Aplicación Móvil Android.

## Core Principles

### I. Stack Tecnológico Unificado y Monorepo
El ecosistema MMedic se desarrolla como un monorepo modular orquestado con **pnpm workspaces** y **Turborepo**, garantizando cohesión y contratos compartidos:
- **Backend API**: NestJS 11 con TypeScript estricto, Prisma ORM 6 y base de datos PostgreSQL 16.
- **Frontend Web**: Angular 19+ utilizando Standalone Components, Signals y Reactive Forms nativos.
- **Móvil Android**: Nativo en Kotlin con Jetpack Compose, Material 3 y cliente de red Retrofit.
- **Paquetes Compartidos**: Tipos, DTOs e interfaces de dominio compartidos en `@mmedic/types`.
*Rationale*: Evita la fragmentación tecnológica, maximiza la reutilización de contratos entre clientes y aprovecha la similitud arquitectónica entre NestJS y Angular.

### II. Autenticación Obligatoria JWT (Stateless & Secure)
Todo endpoint de la API que no sea explícitamente público (como login o registro inicial) **DEBE** exigir autenticación mediante JSON Web Tokens (JWT):
- Los tokens deben ser validados mediante un Guard global (`JwtAuthGuard`) y contener claims mínimos (id de usuario, email, rol y permisos activos).
- Ninguna operación clínica, de consulta de pacientes o agenda puede ejecutarse de forma anónima.
- El ciclo de vida de sesiones debe soportar expiración controlada y rotación de tokens seguros.
*Rationale*: Garantiza la seguridad de acceso a información clínica y cumple con la arquitectura stateless requerida para servir simultáneamente a clientes Web y Móviles.

### III. Autorización Híbrida: Roles (RBAC) + Permisos Granulares Adicionales
El control de acceso en cada endpoint **DEBE** validar el rol del usuario y permitir extensiones mediante permisos quirúrgicos específicos:
- **Herencia de Rol**: Cada usuario tiene asignado un rol base (`ADMIN`, `DOCTOR`, `NURSE`, `PATIENT`), el cual otorga un conjunto de derechos estándar.
- **Permisos Adicionales**: Un usuario puede poseer permisos individuales explícitos que amplían o personalizan sus facultades más allá de su rol (por ejemplo, un `DOCTOR` con permiso adicional `EXPORT_MEDICAL_RECORDS` o `MANAGE_BILLING`).
- **Validación en Endpoint**: Cada controlador o ruta debe declarar sus requerimientos mediante decoradores (`@Roles(...)`, `@RequirePermissions(...)`) ejecutados por un Guard de autorización (`RolesAndPermissionsGuard`).
*Rationale*: La práctica médica y clínica exige flexibilidad; los roles cubren el 90% de los casos, mientras que los permisos granulares permiten atender excepciones operativas sin necesidad de crear roles duplicados o excesivos.

### IV. Preservación Estricta de Principios SOLID
Todo el código escrito en el monorepo (backend NestJS, frontend Angular y móvil Android) **DEBE** respetar los principios SOLID:
- **S (Single Responsibility)**: Cada clase, servicio o componente debe tener una única razón para cambiar. Los controladores solo orquestan HTTP; la lógica de negocio reside en servicios de dominio.
- **O (Open/Closed)**: Las entidades y módulos deben estar abiertos a la extensión pero cerrados a la modificación directa.
- **L (Liskov Substitution)**: Las clases derivadas o implementaciones de interfaces deben ser sustituibles por sus tipos base sin alterar el comportamiento del sistema.
- **I (Interface Segregation)**: Interfaces pequeñas y específicas para cada necesidad. Los clientes no deben depender de métodos que no utilizan.
- **D (Dependency Inversion)**: Los módulos de alto nivel no deben depender de módulos de bajo nivel; ambos deben depender de abstracciones (inyección de dependencias de NestJS y Angular).
*Rationale*: Los sistemas médicos crecen en complejidad regulatoria y funcional; el rigor de SOLID evita que el código se degrade en código espagueti frágil o difícil de auditar.

### V. Servicios Transversales y Contratos Multiplataforma (Web & Android)
La lógica común, contratos de datos y flujos estándar **DEBEN** estructurarse como servicios transversales consumibles por ambas versiones:
- **Formato Unificado de Respuesta**: Todas las respuestas de la API deben apegarse a la estructura estándar `ApiResponse<T>` (`success`, `data`, `message`, `timestamp`).
- **Manejo Centralizado de Errores**: Filtros de excepciones globales en NestJS que retornen códigos de error semánticos y legibles por la Web (Angular) y la App Móvil (Kotlin).
- **Consistencia de Clientes**: Ambos clientes deben implementar interceptores de red para adjuntar el JWT automáticamente y gestionar respuestas de error o tokens caducados de forma idéntica.
*Rationale*: Elimina duplicidad y asegura que tanto médicos en consultorio (Web) como personal en campo o emergencias (Android) experimenten la misma estabilidad y comportamiento.

## Estándares de Seguridad y Protección de Datos Médicos

1. **Validación Estricta de Entrada**: Todo DTO recibido en la API debe ser validado con `ValidationPipe`, `class-validator` y `class-transformer` con flags `whitelist: true` y `forbidNonWhitelisted: true`.
2. **Cifrado de Credenciales**: Las contraseñas se almacenan únicamente usando hashes seguros con salting (bcrypt con mínimo 10 rounds o Argon2).
3. **Privacidad y Auditoría (PII / PHI)**: Los logs estructurados del servidor **NUNCA** deben imprimir contraseñas, tokens JWT, diagnósticos confidenciales ni datos personales identificables.
4. **Protección de Tráfico**: En entornos de producción, todas las comunicaciones se realizan obligatoriamente mediante HTTPS/TLS; en desarrollo local se permite cleartext traffic solo para emuladores y pruebas de red local.

## Flujo de Desarrollo y Quality Gates (Spec-Driven Development)

1. **Desarrollo Guiado por Especificaciones (SDD)**: Cada nueva funcionalidad debe seguir el ciclo riguroso de Spec Kit:
   - `/speckit-specify`: Definir requerimientos funcionales y de negocio.
   - `/speckit-plan`: Diseñar el plan técnico y arquitectura.
   - `/speckit-tasks`: Desglosar en tareas verificables.
   - `/speckit-implement`: Ejecutar la implementación del código.
2. **Puerta de Compilación Limpia**: Ningún cambio o Pull Request puede ser aceptado si `pnpm build` (o la compilación de Android en Gradle) falla.
3. **Integridad de Esquemas**: Cualquier modificación a la base de datos debe originarse en `schema.prisma` y acompañarse de una migración reproducible de Prisma.

## Governance

1. **Supremacía Constitucional**: Esta constitución prevalece sobre convenciones informales o decisiones improvisadas de implementación. Cualquier propuesta que contradiga estos principios debe formalizarse primero como una enmienda a este documento.
2. **Procedimiento de Enmienda**: Las modificaciones a esta constitución requieren:
   - Justificación técnica documentada en el informe de impacto (Sync Impact Report).
   - Incremento del número de versión semántica (MAJOR para cambios de arquitectura o seguridad incompatibles, MINOR para nuevas directrices, PATCH para ajustes de redacción).
3. **Verificación de Cumplimiento**: En cada ciclo de implementación y revisión de código (`/speckit-implement`), el asistente de desarrollo y los ingenieros deben validar la conformidad contra los principios aquí establecidos.

**Version**: 1.0.0 | **Ratified**: 2026-09-20 | **Last Amended**: 2026-09-20
