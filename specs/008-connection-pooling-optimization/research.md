# Research: Connection Pooling & Database Resilience for 1000 Concurrent Users

**Feature**: `008-connection-pooling-optimization`  
**Date**: 2026-09-24  
**Author**: Antigravity Assistant & Engineering Team  

---

## 1. Executive Summary & Problem Analysis

MMedic currently uses a standard NestJS `PrismaService extends PrismaClient` connecting directly to PostgreSQL via `DATABASE_URL`. Under high concurrency (targeting 1000 concurrent clinical/administrative users) and hybrid cloud deployment (Render API + Supabase PostgreSQL + Vercel Web), this baseline configuration presents three critical vulnerabilities:
1. **Connection Pool Exhaustion**: Without explicit `connection_limit` and `pool_timeout` query parameters, concurrent bursts spawn excessive client connections that quickly saturate PostgreSQL / PgBouncer limits (e.g. Supabase 60 direct connection cap), causing `remaining connection slots are reserved` or `too many clients`.
2. **Cursor & Large Query Leaks**: Unbounded `findMany` queries without pagination caps load arbitrarily large result sets, keeping database connection locks active and consuming client memory.
3. **PgBouncer Transaction Mode Incompatibility**: In PgBouncer transaction pooling mode (port 6543 on Supabase), prepared statements and session-pinned cursors fail with `prepared statement already exists`.
4. **Lack of Observability & Silent Connection Saturation**: When connection queues fill up, requests hang indefinitely until gateway 504 timeouts occur, instead of failing fast or queuing cleanly with a fast-fail 503 timeout.

---

## 2. Research Decisions & Findings

### Decision 1: Connection Pool Architecture & PgBouncer Optimization
- **Decision**: Configure Prisma Client connection parameters via `DATABASE_URL` query parameters with `pgbouncer=true`, `connection_limit=10` (per long-running API instance on Render), and `pool_timeout=5` (5 seconds connection acquisition timeout).
- **Rationale**:
  - `pgbouncer=true`: Tells Prisma Client engine to disable prepared statements (`statement_cache_size=0`), perfectly aligning with Supabase's transaction mode pooler (port 6543).
  - `connection_limit=10`: Each Render API instance maintains 10 persistent pool connections. With average clinical query execution times of 10-30ms, 10 connections can easily serve 300-500 requests/sec per instance. With horizontal autoscaling (e.g. 2-3 instances), the total connections to PgBouncer remain at 20-30, well under Supabase's threshold.
  - `pool_timeout=5`: Aligns with user clarification Q2. When pool is saturated, queries wait up to 5 seconds. If no slot frees up, Prisma throws `P2024`, which we capture and convert to HTTP 503.
- **Alternatives Considered**:
  - *Direct connection without PgBouncer*: Rejected. Direct connection to port 5432 exhausts PostgreSQL server connections rapidly under 1000 concurrent user spikes.
  - *Serverless connection limit = 1*: Applicable only if running in AWS Lambda / Vercel Serverless Functions. Since the API runs on Render as a long-running NestJS process, `connection_limit=10` provides optimal throughput without re-handshaking overhead.

### Decision 2: Centralized Wrapper Pattern via Prisma Client Extensions (`$extends`)
- **Decision**: Evolve `PrismaService` using Prisma 6 Client Extensions (`this.$extends(...)`) rather than creating a separate disconnected wrapper class.
- **Rationale**:
  - `PrismaService` is already injected in all 12 backend services (`ArticlesService`, `InvoicesService`, `PatientsService`, etc.).
  - Using Prisma Client Extensions allows hooking into `query.$allModels.$allOperations` natively. Every existing service call (`this.prisma.article.findMany()`, `this.prisma.invoice.create()`) automatically traverses the wrapper without changing a single line of business code in any of the 12 services (FR-010).
  - Preserves full TypeScript autocompletion, type safety, and transactional semantics.
- **Alternatives Considered**:
  - *Custom Repository wrapper class (e.g. `DbWrapperService`)*: Rejected. Would require refactoring all 12 services, rewriting dozens of queries, violating the Open/Closed principle and introducing high risk of regressions.
  - *NestJS Interceptor for DB queries*: Rejected. Interceptors operate at HTTP request boundaries, not at database query execution boundaries. They cannot intercept individual internal queries or transaction statements.

### Decision 3: Enforcing Pagination Limit (FR-011)
- **Decision**: Automatically intercept all `findMany` queries in the extended Prisma client. If `args.take` is undefined or `args.take > 100`, clamp `args.take = 100`.
- **Rationale**:
  - Directly fulfills user clarification Q1 (Session 2026-09-24: Max 100 records per page).
  - Protects against memory bloat and database cursor saturation caused by unintentional full-table dumps.
  - Transparent to existing callers that already specify `<= 100`.
- **Alternatives Considered**:
  - *Throwing an exception if take > 100*: Rejected. Clamping is graceful, does not break existing UI components, and ensures consistent pagination behavior.

### Decision 4: Transient Error Retries for Read Queries (FR-006)
- **Decision**: Implement an exponential backoff retry mechanism (max 2 retries, 100ms and 300ms delays) for idempotent read operations (`findUnique`, `findFirst`, `findMany`, `count`, `aggregate`, `groupBy`) encountering transient network errors (`ECONNRESET`, `ETIMEDOUT`, `P1001`, `P1002`).
- **Rationale**:
  - Cloud-to-cloud connections (Render to Supabase) can experience transient micro-drops (<1 second). Retrying idempotent reads prevents user-visible errors.
  - Write operations (`create`, `update`, `delete`, `upsert`, `$executeRaw`) and transactions are **never** automatically retried to avoid duplicate charges, double invoice creation, or state corruption (FR-006, User Story 5).
- **Alternatives Considered**:
  - *Retrying all operations including writes*: Rejected due to severe data integrity risk (duplicate records / non-idempotent mutations).

### Decision 5: Pool Saturation Handling & HTTP 503 Mapping (FR-012)
- **Decision**: In the global exception filter (`AllExceptionsFilter` / `PrismaExceptionFilter`), catch Prisma error code `P2024` ("Timed out fetching a new connection from the connection pool") and translate it to an HTTP 503 `ServiceUnavailableException` with `Retry-After: 5` header and Spanish user-friendly error message.
- **Rationale**:
  - Aligns with user clarification Q2 (Session 2026-09-24: 5s queue timeout, then HTTP 503).
  - Informs load balancers and clients (Web and Android) that the server is healthy but experiencing a temporary peak load, enabling standard client-side retry policies.
- **Alternatives Considered**:
  - *Letting it bubble as HTTP 500*: Bad practice. 500 signals internal server bug rather than capacity limit.

### Decision 6: Interactive Transaction Timeouts (FR-007)
- **Decision**: Wrap Prisma `$transaction` calls with strict default options: `{ maxWait: 5000, timeout: 10000 }` (5s acquisition wait, 10s execution timeout).
- **Rationale**:
  - Prevents runaway transactions with table locks from permanently holding connections in the pool.
  - If a transaction takes longer than 10 seconds, Prisma cancels it and returns the connection to the pool immediately.
- **Alternatives Considered**:
  - *Unlimited transaction timeout*: High risk of deadlocks freezing the entire connection pool.

### Decision 7: Observability & Health Check Metrics (FR-005, FR-008, SC-006)
- **Decision**: Enhance `HealthService` and `HealthController` (`/health`) to expose real-time pool metrics:
  - `activeQueries`: Count of queries currently executing.
  - `totalQueriesExecuted`: Total queries processed since boot.
  - `queryErrorsCount`: Count of query errors encountered.
  - `p95LatencyMs`: Running p95 query latency.
  - `poolLimit`: Configured maximum pool connections.
  - `saturationWarning`: Boolean indicating if active queries exceed 80% of `poolLimit`.
  - Latency of `/health` remains <100ms by computing metrics from in-memory atomics without acquiring an extra database connection lock unless db ping is requested.
- **Rationale**:
  - Provides instant visibility into connection pressure before outages occur.
  - Emits server log warning when pool utilization hits 80% (FR-008).

---

## 3. Technology Stack Summary

| Component | Choice | Version / Config | Purpose |
|---|---|---|---|
| Runtime | Node.js | >= 20.x | Backend engine |
| Framework | NestJS | ^11.0.10 | REST API architecture |
| ORM | Prisma Client | ^6.4.1 | Data access layer with Client Extensions |
| Database | PostgreSQL | 15+ (Supabase) | Multi-tenant relational storage |
| Connection Pooler | PgBouncer | Port 6543 (Transaction Mode) | Server-side connection multiplexing |
| Wrapper Layer | `PrismaService` + Extensions | In-process singleton | Clamping, retries, pool metrics, leak prevention |

---

## 4. Verification & Testing Strategy

1. **Unit & Integration Tests**:
   - Verify that `findMany` queries without `take` or with `take > 100` are clamped to 100.
   - Verify that read operations retry on transient connection error simulation.
   - Verify that write operations fail immediately without retry on connection error.
   - Verify that Prisma `P2024` error produces HTTP 503.
2. **Stress & Concurrency Verification**:
   - Load test simulation with concurrent database requests to ensure active connections never exceed `connection_limit`.
   - Verify zero connection leaks after 1,000+ operations.
