import {
  resolvePoolConfig,
  buildPooledDatabaseUrl,
} from './prisma-pool.config';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export function runPoolConfigTests() {
  console.log('Running Pool Config Tests...');

  // Test 1: Defaults resolution without environment variables
  const configDefault = resolvePoolConfig('postgresql://user:pass@localhost:5432/mydb');
  assert(configDefault.connectionLimit === 10, 'Default connectionLimit should be 10');
  assert(configDefault.poolTimeoutSeconds === 5, 'Default poolTimeoutSeconds should be 5');
  assert(configDefault.isPgBouncer === false, 'Port 5432 should not be PgBouncer by default');
  assert(configDefault.maxPaginationLimit === 100, 'maxPaginationLimit must be 100 per FR-011');
  assert(configDefault.transactionTimeoutMs === 10000, 'transactionTimeoutMs should default to 10000ms');

  // Test 2: PgBouncer detection via port 6543
  const configPgBouncerPort = resolvePoolConfig(
    'postgresql://user:pass@aws-0-us-west-2.pooler.supabase.com:6543/postgres',
  );
  assert(configPgBouncerPort.isPgBouncer === true, 'Port 6543 should detect PgBouncer');
  assert(configPgBouncerPort.statementCacheSize === 0, 'PgBouncer must have statementCacheSize = 0');

  // Test 3: PgBouncer detection via query parameter
  const configPgBouncerParam = resolvePoolConfig(
    'postgresql://user:pass@host:5432/postgres?pgbouncer=true',
  );
  assert(configPgBouncerParam.isPgBouncer === true, 'pgbouncer=true param should detect PgBouncer');

  // Test 4: Custom connection_limit and pool_timeout in URL
  const configCustom = resolvePoolConfig(
    'postgresql://user:pass@host:6543/postgres?connection_limit=15&pool_timeout=8',
  );
  assert(configCustom.connectionLimit === 15, 'connectionLimit should be parsed as 15');
  assert(configCustom.poolTimeoutSeconds === 8, 'poolTimeoutSeconds should be parsed as 8');

  // Test 5: Clamping bounds on invalid/extreme values
  const configExtreme = resolvePoolConfig(
    'postgresql://user:pass@host:6543/postgres?connection_limit=999&pool_timeout=-5',
  );
  assert(configExtreme.connectionLimit === 10, 'Out of bounds connection_limit (>50) should fall back to default');
  assert(configExtreme.poolTimeoutSeconds === 5, 'Negative pool_timeout should fall back to default');

  // Test 6: URL building injection
  const originalUrl = 'postgresql://user:pass@aws.pooler.supabase.com:6543/postgres';
  const pooledUrl = buildPooledDatabaseUrl(originalUrl, configCustom);
  const parsed = new URL(pooledUrl);
  assert(parsed.searchParams.get('pgbouncer') === 'true', 'buildPooledDatabaseUrl must set pgbouncer=true');
  assert(parsed.searchParams.get('connection_limit') === '15', 'buildPooledDatabaseUrl must set connection_limit=15');
  assert(parsed.searchParams.get('pool_timeout') === '8', 'buildPooledDatabaseUrl must set pool_timeout=8');

  console.log('✓ All Pool Config Tests Passed!');
}

if (require.main === module) {
  runPoolConfigTests();
}
