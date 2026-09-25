# Quickstart & Validation Guide: Connection Pooling & Database Resilience

**Feature**: `008-connection-pooling-optimization`  
**Date**: 2026-09-24  
**Status**: Draft  

---

## 1. Prerequisites

Before running the verification scenarios, ensure the following are available:
- Node.js 20+ and `pnpm` installed.
- Access to the local or cloud Supabase PostgreSQL database.
- Monorepo dependencies installed (`pnpm install`).
- Environment variables configured in `apps/api/.env`:
  ```bash
  DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10&pool_timeout=5"
  DIRECT_URL="postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres"
  ```

---

## 2. Validation Scenarios

### Scenario 1: Health Telemetry & Pool Observability (FR-005, SC-006)
**Goal**: Verify that `GET /health` reports complete pool statistics in under 100ms without consuming extra connection locks.

1. Start the API in development mode:
   ```bash
   pnpm --filter api start:dev
   ```
2. Request health check status:
   ```bash
   curl -s http://localhost:3000/api/v1/health | jq .
   ```
3. **Expected Outcome**:
   - Status code is `200 OK`.
   - Response conforms to [health-contract.json](file:///specs/008-connection-pooling-optimization/contracts/health-contract.json).
   - Contains `database.pool` object with `limit: 10`, `activeQueries`, `saturationWarning: false`, and `p95LatencyMs`.
   - Response time is $< 100\text{ms}$.

---

### Scenario 2: Automatic Query Clamping (FR-011)
**Goal**: Verify that queries requesting more than 100 items (or omitting `take`) are strictly clamped to a maximum of 100 items.

1. Issue a query to any paginated endpoint with `take=500` or without pagination parameters (e.g. `GET /api/v1/articles?limit=500`).
2. Verify the response payload count.
3. **Expected Outcome**:
   - Total items returned in `data` array does not exceed 100.
   - Database log / telemetry records `args.take = 100`.

---

### Scenario 3: Transient Read Retry & Graceful Recovery (FR-006, SC-005)
**Goal**: Verify that transient network hiccups during read operations are retried up to 2 times automatically with exponential backoff.

1. Execute a read query while introducing a transient 500ms network pause or running mock transient error test:
   ```bash
   pnpm --filter api test apps/api/src/prisma/prisma.service.spec.ts
   ```
2. **Expected Outcome**:
   - Read queries succeed on subsequent retry.
   - `retriedQueries` metric increases in `GET /health`.
   - Mutation/write operations (e.g. `POST /api/v1/invoices`) fail immediately without retry if connection drops, preserving idempotency.

---

### Scenario 4: Pool Saturation Fast-Fail (FR-012, SC-003)
**Goal**: Verify that when the connection pool is saturated and requests wait longer than 5 seconds, the system returns HTTP 503 instead of hanging or returning 500.

1. Simulate 25 concurrent long-running queries against an instance configured with `connection_limit=5&pool_timeout=5`.
2. Observe responses from the 6th through 25th requests.
3. **Expected Outcome**:
   - Excess requests queue for up to 5 seconds.
   - Requests that cannot acquire a connection within 5 seconds fail with HTTP `503 Service Unavailable`.
   - Error body contains user-friendly message and `Retry-After: 5` header.
   - Connection pool recovers immediately once active queries complete, with zero leaked connections.

---

### Scenario 5: Full Monorepo Build & Parity Check (Constitution Gate)
**Goal**: Verify zero compiler errors across the workspace.

1. Run the build pipeline:
   ```bash
   pnpm build
   ```
2. **Expected Outcome**:
   - Build completes with code `0`.
   - Cero TypeScript or linting errors in `apps/api`, `apps/web`, and shared packages.
