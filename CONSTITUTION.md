<!--
Sync Impact Report
- Version change: 2.3.0 -> 2.4.0
- Ratification Date: 2026-09-20
- Last Amended Date: 2026-09-20
- Modified Principles:
  * Principle II: Seguridad, Multi-Tenancy y Control de Acceso Granular (Adición de Subsección 2.3: Multi-Tenancy Obligatorio por Defecto y Aislamiento Estricto)
- Added Sections:
  * Declaración de Multi-Tenancy Nativo en Preámbulo (Sección 1)
  * 2.3. Arquitectura Multi-Tenant Obligatoria por Defecto y Aislamiento Estricto
  * Actualización de la Matriz de Criterios de Aceptación Técnicos con Quality Gate de Aislamiento Multi-Tenant
-->

# CONSTITUCIÓN ARQUITECTÓNICA DEL SISTEMA MMEDIC
**Documento de Gobernanza de Software y Directivas de Ingeniería**

---

## 1. Preámbulo y Alcance

El presente documento constituye la **Constitución Técnica de Software** para la plataforma **MMedic**. Establece las directivas de arquitectura, estándares de codificación, controles de seguridad y políticas de higiene de memoria de cumplimiento estricto y no negociable. El sistema opera estructuralmente bajo un paradigma **Multi-Tenant nativo por defecto** en todas sus capas y módulos.

Aplica de forma vinculante a todas las capas y componentes del monorepo:
1. **Backend Unificado**: API REST desacoplada y agnóstica al cliente.
2. **Frontend Web SPA**: Aplicación Web empresarial en Angular.
3. **Móvil Nativo**: Aplicación móvil Android (Kotlin / Jetpack Compose) y su proyección futura a iOS.
4. **Librerías Compartidas**: Paquetes transversales de tipado, contratos y tokens de diseño.

Cualquier fragmento de código que incumpla las directivas aquí expuestas **será rechazado automáticamente** en las etapas de revisión por pares (*Code Review*) y validación de pipelines (*CI/CD Gates*).

---

## 2. Principios Arquitectónicos Fundamentales

### PRINCIPIO I: Stack Tecnológico & Reutilización Transversal

#### 1.1. Backend Agnóstico al Cliente
- El backend (`apps/api`) se construye sobre **NestJS**, **Prisma ORM** y **PostgreSQL** (alojado en la nube en **Supabase** con arquitectura de doble URL: `DATABASE_URL` para el pooler de transacciones y `DIRECT_URL` para migraciones directas).
- Debe operar como una API REST pura, stateless y completamente desacoplada de la interfaz de usuario.
- Ningún endpoint, servicio o capa del backend debe incluir lógica condicional atada a un cliente específico (ej. `if (client === 'android')`). El comportamiento se rige exclusivamente por contratos semánticos y especificaciones OpenAPI/Swagger.

#### 1.2. Contratos Compartidos y Fuente Única de Verdad (Single Source of Truth)
- Los contratos de datos, DTOs de respuesta, enums y modelos de dominio se centralizan en el paquete compartido **`packages/types`** (`@mmedic/types`).
- **Prohibición de Redefinición**: Queda terminantemente prohibido duplicar interfaces o DTOs manualmente en la Web o en la API. Si un contrato cambia, se actualiza en `@mmedic/types` y se propaga al monorepo.
- Las respuestas HTTP deben ceñirse obligatoriamente al envelope tipado `ApiResponse<T>`:
  ```typescript
  export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    timestamp: string;
  }
  ```

#### 1.3. Desacoplamiento y Proyección Mobile (Android & iOS)
- La aplicación móvil actual (`apps/android` en Kotlin / Jetpack Compose) y la futura versión para iOS consumen exactamente los mismos endpoints y esquemas de datos que la aplicación Web SPA.
- Ambas plataformas respetan un **Design Token System** común (paleta de color, espaciados, tipografías y radios de borde definidos de forma equivalente en CSS Tokens y temas de Compose/SwiftUI).

#### 1.4. Trazabilidad Integral y Registro Obligatorio de Errores en Base de Datos
- **Directiva de Persistencia Obligatoria**: Todo método del backend (`apps/api`), incluyendo controladores, casos de uso, servicios de dominio, tareas en segundo plano e interceptores, debe garantizar que ante cualquier fallo, excepción no controlada o error de negocio se capture y registre de manera obligatoria una traza o log en la base de datos (PostgreSQL).
- **Campos Estructurados Requeridos**: Cada registro de log en la base de datos debe contener sin excepción los siguientes metadatos:
  1. **Fichero (`fileName` / `sourceFile`)**: Nombre y ruta del archivo fuente donde se originó el error.
  2. **Línea (`lineNumber` / `line`)**: Número de línea exacta del código donde se produjo la falla.
  3. **Mensaje de Error (`errorMessage` / `message`)**: Mensaje técnico o semántico emitido por la excepción.
  4. **Descripción del Error (`description` / `errorDescription`)**: Contexto ampliado del fallo, parámetros asociados o traza completa de ejecución (*stack trace*).
  5. **Usuario (`userId` / `user`)**: Identificador o información del usuario autenticado que ejecutó la operación (o `'SYSTEM'` / `'ANONYMOUS'` si la llamada no posee sesión activa).
  6. **Fecha (`timestamp` / `createdAt`)**: Marca temporal precisa (UTC) del instante exacto del error.
  7. **Tipo de Error (`errorType`)**: Categoría o clase de la excepción (ej. `HttpException`, `PrismaClientKnownRequestError`, `ValidationError`, `BusinessRuleException`, `InternalServerError`).
- **Captura Centralizada y No Bloqueante**: La persistencia de logs debe implementarse de forma desacoplada y asíncrona (mediante filtros de excepción globales como `GlobalExceptionFilter` o servicios de auditoría inyectables) para evitar duplicación de código en la lógica de negocio y garantizar que un problema al escribir en la tabla de auditoría nunca degrade la respuesta estándar tipada devuelta al cliente.

#### 1.5. Control Estricto de Esquema, Migraciones Atómicas y Evolución de Base de Datos
- **Principio de Cero Alteraciones Manuales (*Zero Manual DB Changes*)**: Queda terminantemente prohibido modificar la estructura o los datos de la base de datos de manera manual, ad-hoc o directa mediante clientes SQL en cualquier entorno (desarrollo, pruebas o producción). Toda evolución debe estar versionada y automatizada en código.
- **Granularidad Obligatoria por Migración**:
  1. **Creación de Tablas**: Toda nueva entidad, tabla o relación del modelo relacional debe definirse en el esquema de Prisma (`schema.prisma`) y contar con su propio archivo de migración atómico e individual generado en el directorio de migraciones.
  2. **Modificación de Columnas (Altas, Bajas y Cambios)**: Cada columna que se agregue, modifique (tipo de dato, restricciones de nulabilidad, valores por defecto) o se elimine de una tabla existente **DEBE** contar con una migración específica que documente y ejecute dicha alteración de esquema de forma controlada.
  3. **Inserción y Mutación de Datos**: Cualquier dato que se inserte (datos maestros iniciales, catálogos de referencia, semillas requeridas para operación o mutaciones estructurales de datos existentes) debe gestionarse obligatoriamente mediante scripts de migración de datos o semillas reproducibles y versionadas (`seed` scripts o migraciones SQL DML), garantizando su idempotencia.
- **Integridad y Verificación en Pipelines**: Ninguna modificación de base de datos se considerará aceptada si genera discrepancias (*drift*) entre el esquema de Prisma y el historial de migraciones versionadas (`prisma migrate status`).

---

### PRINCIPIO II: Seguridad, Multi-Tenancy y Control de Acceso Granular (RBAC + PBAC)

#### 2.1. Autenticación Stateless Obligatoria vía JWT
- Todos los endpoints privados exigen autenticación mediante tokens **JSON Web Token (JWT)** firmados criptográficamente.
- El ciclo de autenticación es estrictamente stateless: el servidor no mantiene sesiones en memoria ni en base de datos para la validación de peticiones ordinarias.
- Todo endpoint privado debe estar protegido por un guard de autenticación (`JwtAuthGuard`) activo por defecto, requiriendo el decorador explícito `@Public()` para rutas abiertas.

#### 2.2. Modelo Híbrido de Autorización en Dos Niveles (RBAC + PBAC)
El control de acceso implementa una matriz de seguridad de doble validación:
1. **Nivel 1 - Rol Base (Role-Based Access Control - RBAC)**:
   - Identifica el grupo estructural del usuario: `ADMIN`, `DOCTOR`, `NURSE`, `PATIENT`.
   - Provee el conjunto de derechos base y accesos generales al sistema.
2. **Nivel 2 - Permiso Específico por Acción/Recurso (Permission-Based Access Control - PBAC)**:
   - Otorga capacidades atómicas para acciones y recursos concretos (ej. `PATIENT_RECORD_EXPORT`, `APPOINTMENT_FORCE_CANCEL`, `BILLING_AUDIT`).
   - **Regla de Adición**: Un usuario hereda los derechos inherentes de su rol más cualquier permiso adicional asignado explícitamente a su identidad.
   - **Evaluación**: La autorización se verifica mediante la composición de decoradores y guards dedicados:
     ```typescript
     @Roles(Role.DOCTOR, Role.ADMIN)
     @RequirePermissions(Permission.PATIENT_RECORD_EXPORT)
     @Post(':id/export')
     async exportMedicalRecord(@Param('id') id: string) { ... }
     ```

#### 2.3. Arquitectura Multi-Tenant Obligatoria por Defecto y Aislamiento Estricto
- **Regla Fundamental de Desarrollo (Multi-Tenant by Default)**: Toda la arquitectura, diseño y desarrollo de la plataforma MMedic es **Multi-Tenant por defecto**. Todo desarrollo (tablas en base de datos, modelos en Prisma, endpoints en API, lógica de negocio en servicios, almacenamiento y vistas de UI) debe operar bajo aislamiento estricto de inquilinos (*tenants* / organizaciones / clínicas), **a menos que se especifique y justifique explícitamente lo contrario** en la documentación técnica de alguna sección o módulo concreto.
- **Aislamiento en Base de Datos y Modelado**:
  - Todo modelo y tabla relacional en PostgreSQL / Prisma debe incorporar obligatoriamente una columna `tenantId` (con su correspondiente clave foránea e índice compuesto), garantizando que ningún dato pertenezca al ámbito global salvo excepción autorizada.
  - Toda consulta (`SELECT`, `UPDATE`, `DELETE`) ejecutada en el backend debe aplicar de forma inexcusable el filtro por `tenantId` correspondiente al contexto del usuario autenticado.
- **Resolución y Propagación del Contexto de Tenant**:
  - El backend (`apps/api`) debe resolver el inquilino activo en cada solicitud entrante (a través del token JWT validado o cabecera de contexto autorizada) e inyectarlo en el ciclo de vida de la petición mediante middlewares o interceptores desacoplados.
  - Se prohíbe terminantemente la fuga de datos (*Data Leakage*) entre diferentes inquilinos. Un usuario u operador jamás tendrá visibilidad ni capacidad de mutación sobre registros pertenecientes a otro `tenantId`.
- **Régimen de Excepciones Formales**:
  - Si un módulo o tabla requiere ser transversal o global (por ejemplo: catálogos médicos universales, tablas de auditoría de infraestructura central o superadministración del sistema SaaS), dicha condición debe declararse explícitamente como una excepción arquitectónica en su especificación de requerimientos (`spec.md`), justificando por qué prescinde de la clave `tenantId`.

---

### PRINCIPIO III: Arquitectura de Código y Principios SOLID

#### 3.1. Cumplimiento Estricto de SOLID
- **S (Single Responsibility)**: Cada clase, función o componente tiene una única responsabilidad bien definida. Los controladores manejan transporte; los servicios manejan lógica de negocio; los repositorios manejan persistencia.
- **O (Open/Closed)**: El sistema se extiende agregando nuevos módulos, estrategias o interceptores, sin modificar código fuente estabilizado.
- **L (Liskov Substitution)**: Las implementaciones de servicios o clientes deben satisfacer sus abstracciones sin provocar efectos colaterales inesperados.
- **I (Interface Segregation)**: Interfaces pequeñas y quirúrgicas. Ningún consumidor debe depender de métodos que no ejecuta.
- **D (Dependency Inversion)**: Los módulos de alto nivel dependen exclusivamente de abstracciones (interfaces/tokens de inyección), nunca de clases concretas.

#### 3.2. Cláusula de Controladores Delgados (*Tiny Controllers*)
- **Límite de Tamaño**: Ningún archivo controlador en la API podrá exceder las **80 líneas de código (LOC)** (rango obligatorio: 50 a 80 LOC).
- **Prohibición de Lógica de Negocio**: Un controlador únicamente puede:
  1. Capturar parámetros de entrada y aplicar pipes de validación (`ValidationPipe`).
  2. Verificar decoradores de seguridad (`@Roles`, `@RequirePermissions`).
  3. Delegar la ejecución a un caso de uso o servicio de dominio inyectado.
  4. Retornar el DTO de respuesta transformado.

#### 3.3. Regla Universal de Complejidad (*300 LOC Rule*)
- **Umbral Máximo**: Ningún componente de interfaz (UI), servicio, clase o archivo fuente del proyecto podrá superar las **300 líneas de código (LOC)**.
- **Acción Obligatoria de Refactorización**: Al alcanzar o superar las 300 LOC, el desarrollador **DEBE** particionar el archivo en subcomponentes modulares, hooks/composables, servicios helpers o clases de soporte cohesivas.

---

### PRINCIPIO IV: Estado, Reactividad y Gestión de Memoria

#### 4.1. Reactividad basada en Signals
- En el frontend Web (Angular 19+), el estado reactivo se gestiona exclusivamente mediante **Signals** (`signal()`, `computed()`, `linkedSignal()`).
- Se destierran patrones obsoletos basados en mutaciones de estado manuales o subscripciones complejas no controladas en componentes.

#### 4.2. Comunicación Intermodular Desacoplada
- Queda terminantemente prohibido el acoplamiento directo o referencias cruzadas entre componentes hermanos o módulos de diferente dominio.
- Toda comunicación entre características (*features*) debe orquestarse mediante **servicios inyectables (`@Injectable({ providedIn: 'root' })`)** que actúen como buses de eventos o gestores de estado centralizados.

#### 4.3. Higiene Estricta de Memoria y Ciclo de Vida
Para garantizar estabilidad y prevenir fugas de memoria (*memory leaks*):
1. **Destrucción de Recursos**: Todo componente o servicio con ciclo de vida limitado **DEBE** liberar activamente sus recursos en su gancho de destrucción (`ngOnDestroy` en Angular, `DisposableEffect` / `onDispose` en Jetpack Compose):
   - Cancelación obligatoria de subscripciones RxJS (usando `takeUntilDestroyed()`, `DestroyRef` o `Subject` de cierre).
   - Desvinculación de event listeners manuales del DOM o del sistema operativo.
   - Cancelación de temporizadores (`setInterval`, `setTimeout`) y corrutinas móviles en ejecución.
2. **Reset de Señales y Referencias**: El estado efímero debe reinicializarse y las referencias pesadas deben anularse para habilitar el barrido inmediato del *Garbage Collector*.

---

### PRINCIPIO V: Estándares UI/UX y Sistema de Diseño Centralizado

#### 5.1. Heurísticas Avanzadas de UX y Minimalismo
- Las interfaces de usuario deben priorizar la simplicidad visual, la baja carga cognitiva y el flujo de trabajo natural del personal médico y administrativo.
- Cumplimiento estricto de las heurísticas de Nielsen: visibilidad continua del estado del sistema, prevención proactiva de errores, consistencia de navegación y confirmaciones explícitas antes de acciones destructivas (ej. anulación de historias médicas o citas).

#### 5.2. Sistema de Tokens de Diseño Centralizado (Design Tokens)
- No se admiten colores, tipografías, sombras ni dimensiones "quemadas" (*hardcoded*) en estilos locales o componentes.
- Todos los valores estéticos derivan de variables de diseño estandarizadas:
  - Paleta HSL/Hex unificada para estados: Primario, Superficie, Éxito, Advertencia, Error y Neutros.
  - Escala modular de espaciados (4px, 8px, 12px, 16px, 24px, 32px, 48px).
  - Soporte de Temas (Modo Oscuro / Modo Claro) gobernado por atributos raíz y variables CSS.

#### 5.3. Filosofía Mobile-First y Diseño Totalmente Adaptativo (Responsive Cross-Device)
- **Directiva Mobile-First Obligatoria**: Todo componente, vista, pantalla y flujo de usuario debe diseñarse, maquetarse y validarse de manera prioritaria para dispositivos móviles y pantallas reducidas, aplicando principios de mejora progresiva (*progressive enhancement*) hacia viewports de mayor escala.
- **Cobertura y Comportamiento por Rango de Pantalla**:
  1. **Dispositivos Móviles y Pantallas Chicas (< 640px)**: 
     - Interfaces táctiles fluidas con áreas de toque accesibles (mínimo 44x44px).
     - Tipografía legible sin necesidad de zoom ni desplazamiento lateral.
     - **Tolerancia Cero al Overflow Horizontal**: Queda estrictamente prohibido el desbordamiento horizontal involuntario (`overflow-x`) en pantallas pequeñas; los contenedores, tablas y modales deben reorganizarse en tarjetas (*cards*) o utilizar scrolls internos delimitados.
  2. **Tablets y Pantallas Medianas (640px a 1024px)**: 
     - Reorganización de layouts hacia grillas de 2 a 3 columnas, adaptando menús de navegación a formatos tipo *rail* o barras superiores dinámicas según la orientación (vertical u horizontal).
  3. **Escritorio y Pantallas Grandes / PC (> 1024px)**: 
     - Despliegue de paneles enriquecidos, barras laterales completas (colapsables), vistas maestro-detalle integradas y tablas densas optimizadas para cursor y teclado.
     - Delimitación de anchos máximos (`max-w-*`) en bloques de contenido y lectura para preservar la ergonomía visual y evitar líneas excesivamente largas.
- **Estructura Técnica de Media Queries**: Toda hoja de estilos (CSS) debe estructurarse obligatoriamente bajo enfoque Mobile-First ascendente utilizando directivas `min-width`, erradicando el uso caótico de reglas descendentes con `max-width`.

---

## 3. Matriz de Criterios de Aceptación Técnicos (Quality Gates)

| Requisito | Métrica / Criterio Verificable | Herramienta de Auditoría |
|---|---|---|
| **Límite de Controladores** | Longitud $\le$ 80 LOC. Cero lógica de negocio. | Linter / Sonar / Code Review |
| **Límite de Clases/Componentes** | Longitud $\le$ 300 LOC. Modularización forzosa si supera el límite. | ESLint (`max-lines`) / Detekt |
| **Autenticación en Rutas** | 100% de endpoints privados con Guard JWT y validación de permisos. | Tests de Integración E2E |
| **Aislamiento Multi-Tenant** | 100% de tablas y consultas con filtro obligatorio por `tenantId` (salvo excepción explícita en spec). | Middleware / Prisma Extensions / Tests E2E |
| **Integridad de Contratos** | Tipos compartidos importados exclusivamente de `@mmedic/types`. | TypeScript Compiler (`tsc`) |
| **Higiene de Memoria** | Uso estricto de `takeUntilDestroyed` o cancelación en destrucción. | ESLint RxJS / Profiler |
| **Trazabilidad de Errores en BD** | 100% de errores/excepciones backend persistidos en BD (fichero, línea, mensaje, descripción, usuario, fecha, tipo). | Exception Filters / Logger Service / Tests E2E |
| **Control de Migraciones en BD** | 100% de tablas, columnas (altas/bajas) y datos insertados gestionados vía migraciones versionadas de Prisma. | Prisma CLI (`prisma migrate status`) / CI Gates |
| **Diseño Mobile-First y Adaptativo** | 100% de vistas funcionales sin overflow horizontal en móviles (<640px), tablets (640-1024px) y PC (>1024px). | Browser DevTools / Viewport Tests / Lighthouse |
| **Compilación y Build** | Cero errores o advertencias en `pnpm build` de todo el monorepo. | Turborepo Pipeline |

---

## 4. Gobernanza y Procedimiento de Enmiendas

1. **Supremacía Legal del Código**: Esta constitución actúa como el contrato supremo del repositorio. Ninguna urgencia de desarrollo o deuda técnica justificará vulnerar sus cláusulas.
2. **Procedimiento de Enmienda**:
   - Una enmienda requiere propuesta formal, revisión por el Arquitecto de Software y consenso técnico.
   - Cualquier cambio estructural implica un incremento de versión semántica (MAJOR para cambios de paradigma, MINOR para adición de directivas, PATCH para precisiones de redacción).
3. **Auditoría Continua**: En cada ciclo de desarrollo bajo Spec Kit (`/speckit-plan` y `/speckit-implement`), el asistente de IA y el equipo humano validarán obligatoriamente la adherencia estricta a este documento.

---

**Versión Constitucional**: 2.4.0  
**Fecha de Ratificación**: 2026-09-20  
**Fecha de Última Enmienda**: 2026-09-20  
**Estado**: ACTIVA Y VINCULANTE
