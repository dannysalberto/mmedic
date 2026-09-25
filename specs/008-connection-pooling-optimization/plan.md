# Implementation Plan: Connection Pooling & Database Resilience for 1000 Concurrent Users

**Branch**: `008-connection-pooling-optimization` | **Date**: 2026-09-24 | **Spec**: [spec.md](file:///specs/008-connection-pooling-optimization/spec.md)

**Input**: Feature specification from `specs/008-connection-pooling-optimization/spec.md`

---

## Summary

Implement an enterprise-grade database connection pool wrapper and resilience architecture in `apps/api` capable of sustaining 1000 concurrent users without connection exhaustion, memory leaks, or cursor saturation. The solution evolves the existing `PrismaService` using Prisma 6 Client Extensions (`$extends`), configuring PgBouncer-compatible parameters (`pgbouncer=true`, `connection_limit=10`, `pool_timeout=5`), automatically clamping paginated queries to a maximum of 100 records (FR-011), retrying idempotent read queries on transient network drops with exponential backoff (FR-006), failing fast with HTTP 503 on pool saturation timeouts (FR-012), enforcing strict 10s interactive transaction timeouts (FR-007), and exposing real-time connection pool telemetry on the `/health` endpoint (FR-005, FR-008).

---

## Technical Context

**Language/Version**: TypeScript 5.7.3, Node.js 20+ (ES2022)  
**Primary Dependencies**: NestJS ^11.0.10 (`@nestjs/common`, `@nestjs/core`, `@nestjs/config`, `@nestjs/swagger`), Prisma Client ^6.4.1  
**Storage**: PostgreSQL 15+ hosted on Supabase, connected through PgBouncer transaction pooler (port 6543) via `DATABASE_URL` and direct connection (port 5432) via `DIRECT_URL`  
**Testing**: Jest ^29.x, Supertest, pnpm build validation  
**Target Platform**: Render (API container / long-running Node service), Supabase (PostgreSQL + PgBouncer), Vercel (Web frontend consumer)  
**Project Type**: Backend REST API infrastructure (`apps/api`) within Turbo monorepo  
**Performance Goals**:
- Support 1000 concurrent simulated users with $< 1\%$ connection error rate.
- 95% of queries under load complete in $< 2$ seconds.
- `/health` endpoint delivers full pool metrics in $< 100\text{ms}$.
- Zero connection leaks across 10,000 consecutive operations.  
**Constraints**:
- Supabase direct connection ceiling (60 connections).
- Mandatory upper pagination clamp of 100 records per `findMany` query.
- Pool saturation queue wait capped at 5 seconds before returning HTTP 503.
- Interactive transaction timeout capped at 10 seconds.
- Full backward compatibility with the existing 12 domain services.  
**Scale/Scope**:
- 12 backend domain services in `apps/api` (articles, invoices, patients, contributors, entities, categories, users, permissions, appointments, auth, health).
- Strict adherence to Constitution rules: controllers $\le$ 80 LOC, files $\le$ 300 LOC.

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Constitutional Directive | Compliance Status | Implementation Detail / Justification |
|---|---|---|
| **1.3. Paridad Dual Web-Android** | **PASS (Excepción Formal Justificada)** | Esta funcionalidad es 100% de infraestructura interna del backend (`apps/api`) y capa de persistencia en PostgreSQL. Ni la aplicación Web (`apps/web`) ni la aplicación Android (`apps/android`) se conectan directamente a la base de datos; ambas consumen exclusivamente los endpoints de la API REST. La excepción está formalmente documentada en la sección *Assumptions* del `spec.md`. |
| **1.1. Backend Agnóstico al Cliente** | **PASS** | El backend no introduce lógica condicional dependiente del cliente. Las optimizaciones de pool benefician de forma idéntica a Web y Android. |
| **1.2. Contratos Compartidos** | **PASS** | Los modelos de salud y métricas de pool se tipifican y exportan congruentemente. |
| **1.4. Trazabilidad de Errores en BD** | **PASS** | El filtro global de excepciones captura y registra eventos de timeout de conexión (`P2024`) en la base de datos cuando esté disponible, o en logs estructurados con alerta si la BD está inaccesible. |
| **1.5. Control Estricto de Esquema** | **PASS** | No se altera el esquema relacional de PostgreSQL; las métricas de salud del pool son efímeras y se calculan en memoria en tiempo de ejecución. |
| **2.3. Aislamiento Multi-Tenant** | **PASS** | El wrapper de conexión opera de forma transparente a nivel de infraestructura, preservando todos los filtros `tenantId` inyectados por los servicios de negocio. |
| **3.2. Controladores Delgados ($\le$ 80 LOC)** | **PASS** | `HealthController` cuenta con 17 LOC y se mantiene bajo 30 LOC con la incorporación de los nuevos datos de pool. |
| **3.3. Límite de 300 LOC por Archivo** | **PASS** | La lógica de extensiones de Prisma, reintentos y métricas de pool se dividirá en módulos cohesivos: `prisma.service.ts` (~80 LOC), `prisma-pool.util.ts` (~90 LOC), `prisma-metrics.service.ts` (~110 LOC). |
| **5.4. Notificaciones Push y Navegación** | **N/A** | Módulo de infraestructura backend sin interfaz de usuario directa. |

---

## Project Structure

### Documentation (this feature)

```text
specs/008-connection-pooling-optimization/
├── spec.md              # Feature specification with clarifications
├── plan.md              # This implementation plan
├── research.md          # Phase 0 research & technical decisions
├── data-model.md        # Phase 1 data & runtime entities schema
├── quickstart.md        # Phase 1 verification & validation guide
├── contracts/           # Phase 1 interface contracts
│   ├── health-contract.json
│   └── pool-config-contract.json
└── tasks.md             # Phase 2 task execution breakdown (via /speckit-tasks)
```

### Source Code Impact (repository layout)

```text
apps/api/
├── src/
│   ├── prisma/
│   │   ├── prisma.module.ts              # Global module exporting PrismaService and PoolMetricsService
│   │   ├── prisma.service.ts             # Enhanced PrismaService with $extends client wrapper
│   │   ├── prisma-pool.config.ts         # Pool parameter parser & validation (connection_limit, timeouts)
│   │   ├── prisma-pool.extension.ts      # Prisma Client extension (FR-011 clamp 100, FR-006 retry read)
│   │   └── prisma-metrics.service.ts     # In-memory query metrics & saturation monitoring (FR-005, FR-008)
│   ├── common/
│   │   └── filters/
│   │       └── prisma-exception.filter.ts # Maps P2024 pool timeout to HTTP 503 Service Unavailable (FR-012)
│   └── modules/
│       └── health/
│           ├── health.controller.ts      # Health check controller (< 80 LOC)
│           ├── health.service.ts         # Integrates PoolMetricsService into health response
│           └── dto/
│               └── health-response.dto.ts # Swagger/OpenAPI DTO matching health-contract.json
└── .env.example                          # Updated connection string templates for Supabase PgBouncer
```

**Structure Decision**:
The implementation extends `apps/api/src/prisma/` into a cohesive, modular subpackage where each component remains strictly under 150 LOC (well below the 300 LOC limit). The 12 existing domain services remain untouched in their public interface, receiving the enhanced extended client automatically through dependency injection.

---

## Implementation Phases

### Phase 0: Outline & Research *(Completed)*
- Documented in [research.md](file:///specs/008-connection-pooling-optimization/research.md).
- Resolved PgBouncer compatibility (`pgbouncer=true`, `connection_limit=10`, `pool_timeout=5`).
- Resolved wrapper pattern (Prisma Client `$extends`).
- Resolved pagination clamp (clamp to 100 records max).
- Resolved read retry policy (exponential backoff, 2 retries, idempotent queries only).
- Resolved pool saturation strategy (5s queue, then HTTP 503).
- Resolved transaction timeout (interactive `$transaction` with 10s timeout).

### Phase 1: Design & Contracts *(Completed)*
- Runtime entities and lifecycle documented in [data-model.md](file:///specs/008-connection-pooling-optimization/data-model.md).
- JSON Schema contracts created in [contracts/](file:///specs/008-connection-pooling-optimization/contracts/):
  - [health-contract.json](file:///specs/008-connection-pooling-optimization/contracts/health-contract.json)
  - [pool-config-contract.json](file:///specs/008-connection-pooling-optimization/contracts/pool-config-contract.json)
- Validation scenarios documented in [quickstart.md](file:///specs/008-connection-pooling-optimization/quickstart.md).

### Phase 2: Implementation (Deferred to `/speckit-tasks` and `/speckit-implement`)
1. Implement `prisma-pool.config.ts` to parse and validate pool configuration.
2. Implement `prisma-metrics.service.ts` to track in-memory latency and saturation warnings ($\ge 80\%$).
3. Implement `prisma-pool.extension.ts` providing query clamping (`take: 100`) and idempotent read retries.
4. Update `prisma.service.ts` to initialize extended client and handle safe transaction timeouts.
5. Implement or update exception filters to map `P2024` to HTTP 503.
6. Enhance `HealthService` and `HealthController` to return pool telemetry.
7. Run end-to-end and build verification tests.

---

## Complexity Tracking

| Consideration | Decision | Justification |
|---|---|---|
| Prisma Client Extension vs Custom Repository Layer | Prisma `$extends` | Keeps all 12 services intact without refactoring hundreds of LOC, zero risk of breaking regressions. |
| In-Memory Pool Metrics vs Redis / DB Metrics Table | In-Memory Ring Buffer | Guarantees $< 100\text{ms}$ health check responses without consuming extra database connection slots or requiring external infrastructure. |
