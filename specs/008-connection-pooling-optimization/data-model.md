# Data Model & Infrastructure Schema: Connection Pooling & Resilience

**Feature**: `008-connection-pooling-optimization`  
**Date**: 2026-09-24  
**Status**: Draft  

---

## 1. Overview

This feature operates at the infrastructure and data-access layer of `apps/api`. It introduces runtime data structures, configuration models, and monitoring entities to govern database connection pooling, query clamping, transient error retries, and health telemetry.

No relational database tables are altered or added in PostgreSQL; all operational metrics and state tracking reside in high-performance in-memory ring buffers and atomic counters to guarantee zero performance overhead.

---

## 2. Configuration & Runtime Entities

### 2.1. `PoolConfig` (Database Pool Configuration Entity)

Represents the parsed and validated connection pool parameters derived from environment variables and `DATABASE_URL`.

| Attribute | Type | Default | Description | Validation Rules |
|---|---|---|---|---|
| `connectionLimit` | `number` | `10` | Maximum client connections allocated per API instance | Must be integer between `1` and `50`. |
| `poolTimeout` | `number` | `5` | Seconds to wait for a connection slot before aborting (FR-012) | Must be integer between `1` and `30`. |
| `statementCacheSize` | `number` | `0` | Prepared statement cache size (`0` for PgBouncer transaction mode) | Must be `0` when `pgbouncer=true`. |
| `transactionTimeout` | `number` | `10000` | Milliseconds before an interactive transaction is aborted (FR-007) | Range: `1000` to `60000` ms. |
| `transactionMaxWait` | `number` | `5000` | Milliseconds to wait to acquire transaction slot | Range: `500` to `15000` ms. |
| `maxPaginationLimit` | `number` | `100` | Mandatory upper limit on `take` for `findMany` queries (FR-011) | Fixed to `100` per clarification Q1. |
| `maxRetries` | `number` | `2` | Number of retries for idempotent read queries on transient error | Integer `0` to `3`. |

---

### 2.2. `PoolMetrics` (In-Memory Observability Entity)

Maintained by `PrismaService` to track real-time connection pressure and query health.

| Field | Type | Description |
|---|---|---|
| `activeQueries` | `number` | Current count of in-flight queries executing against PostgreSQL. |
| `totalQueries` | `number` | Cumulative total of queries executed since application boot. |
| `totalErrors` | `number` | Cumulative total of database query failures. |
| `retriedQueries` | `number` | Total number of read queries recovered via automatic retry. |
| `p95LatencyMs` | `number` | 95th percentile query execution duration (calculated over rolling window of last 100 queries). |
| `poolLimit` | `number` | Configured connection limit for the active instance. |
| `saturationPercentage` | `number` | Ratio of `activeQueries / poolLimit * 100`. |
| `saturationWarning` | `boolean` | Flag set to `true` when `saturationPercentage >= 80%` (FR-008). |
| `lastSaturationAt` | `string \| null` | ISO timestamp of the most recent saturation warning event. |

---

### 2.3. `DatabaseHealthResponse` (API Health Contract Entity)

Exposed by `GET /api/v1/health` (or `/health`) to reporting agents, load balancers, and administrators.

```typescript
export interface DatabaseHealthResponse {
  status: 'ok' | 'degraded' | 'error';
  service: string;
  version: string;
  uptime: number;
  database: {
    status: 'connected' | 'degraded' | 'disconnected';
    latencyMs?: number;
    pool: {
      limit: number;
      activeQueries: number;
      saturationWarning: boolean;
      p95LatencyMs: number;
    };
  };
  timestamp: string;
}
```

---

## 3. State Transitions & Lifecycle

### 3.1. Query Execution & Clamping Lifecycle

```
[Service Call: this.prisma.entity.findMany(args)]
                     │
                     ▼
       [Prisma Extension: query hook]
                     │
         Is operation === 'findMany'?
             ├── YES ──► args.take = clamp(args.take ?? 100, 100)
             └── NO  ──► proceed unchanged
                     │
                     ▼
    [Increment activeQueries counter]
    [Check activeQueries / poolLimit >= 80%] ──► If true, log WARNING (FR-008)
                     │
                     ▼
          [Execute Native Query]
         /                     \
      SUCCESS                 FAILURE
        │                        │
        ▼                        ▼
[Record latency]        Is transient error & read op?
[Decrement activeQueries]    ├── YES (attempt < maxRetries) ──► Backoff (100ms, 300ms) ──► Re-execute
        │                    └── NO / Write op ──► Decrement activeQueries
        ▼                                          Translate error (e.g. P2024 -> HTTP 503)
     [Return]                                      Throw Exception
```

### 3.2. Transaction Lifecycle with Timeout Protection

```
[this.prisma.$safeTransaction(async (tx) => { ... })]
                     │
                     ▼
[Attach default options: maxWait=5000, timeout=10000]
                     │
                     ▼
          [Execute Interactive Tx]
         /                        \
      SUCCESS                   FAILURE / TIMEOUT
        │                              │
        ▼                              ▼
    [Commit]                  [Rollback triggered by Prisma]
[Release connection < 50ms]    [Release connection immediately < 50ms]
        │                              │
     [Return]                 [Throw TransactionFailedException]
```

---

## 4. Multi-Tenant Consistency & Security

- **Tenant Isolation**: All existing multi-tenant filters (`tenantId`) configured in business services remain unchanged and are strictly honored during query execution.
- **Data Protection**: Clamping queries to 100 records ensures that even a misconfigured search query cannot bridge or flood tenant boundaries with excessive buffer allocations.
