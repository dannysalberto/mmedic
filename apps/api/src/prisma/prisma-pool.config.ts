export interface PoolConfig {
  isPgBouncer: boolean;
  connectionLimit: number;
  poolTimeoutSeconds: number;
  statementCacheSize: number;
  transactionTimeoutMs: number;
  transactionMaxWaitMs: number;
  maxPaginationLimit: number;
  maxRetries: number;
}

const DEFAULT_CONNECTION_LIMIT = 10;
const DEFAULT_POOL_TIMEOUT_SECONDS = 5;
const DEFAULT_TX_TIMEOUT_MS = 10000;
const DEFAULT_TX_MAX_WAIT_MS = 5000;
const MAX_PAGINATION_LIMIT = 100;
const DEFAULT_MAX_RETRIES = 2;

/**
 * Parses and resolves database connection pooling configuration
 * adhering to MMedic scalability and resilience constraints.
 */
export function resolvePoolConfig(rawUrl?: string): PoolConfig {
  const urlString = rawUrl || process.env.DATABASE_URL || '';
  let isPgBouncer = false;
  let connectionLimit = DEFAULT_CONNECTION_LIMIT;
  let poolTimeoutSeconds = DEFAULT_POOL_TIMEOUT_SECONDS;

  if (urlString.startsWith('postgres://') || urlString.startsWith('postgresql://')) {
    try {
      const parsedUrl = new URL(urlString);
      const pgbouncerParam = parsedUrl.searchParams.get('pgbouncer');
      isPgBouncer = pgbouncerParam === 'true' || parsedUrl.port === '6543';

      const connLimitParam = parsedUrl.searchParams.get('connection_limit');
      if (connLimitParam) {
        const parsed = parseInt(connLimitParam, 10);
        if (!isNaN(parsed) && parsed > 0 && parsed <= 50) {
          connectionLimit = parsed;
        }
      }

      const poolTimeoutParam = parsedUrl.searchParams.get('pool_timeout');
      if (poolTimeoutParam) {
        const parsed = parseInt(poolTimeoutParam, 10);
        if (!isNaN(parsed) && parsed > 0 && parsed <= 30) {
          poolTimeoutSeconds = parsed;
        }
      }
    } catch {
      // Keep defaults on unparseable URL
    }
  }

  // Environment variable overrides if URL did not specify them
  if (process.env.DB_CONNECTION_LIMIT) {
    const envLimit = parseInt(process.env.DB_CONNECTION_LIMIT, 10);
    if (!isNaN(envLimit) && envLimit > 0 && envLimit <= 50) {
      connectionLimit = envLimit;
    }
  }

  if (process.env.DB_POOL_TIMEOUT_SECONDS) {
    const envTimeout = parseInt(process.env.DB_POOL_TIMEOUT_SECONDS, 10);
    if (!isNaN(envTimeout) && envTimeout > 0 && envTimeout <= 30) {
      poolTimeoutSeconds = envTimeout;
    }
  }

  const transactionTimeoutMs = process.env.DB_TX_TIMEOUT_MS
    ? parseInt(process.env.DB_TX_TIMEOUT_MS, 10) || DEFAULT_TX_TIMEOUT_MS
    : DEFAULT_TX_TIMEOUT_MS;

  return {
    isPgBouncer,
    connectionLimit,
    poolTimeoutSeconds,
    statementCacheSize: isPgBouncer ? 0 : 100,
    transactionTimeoutMs,
    transactionMaxWaitMs: DEFAULT_TX_MAX_WAIT_MS,
    maxPaginationLimit: MAX_PAGINATION_LIMIT,
    maxRetries: DEFAULT_MAX_RETRIES,
  };
}

/**
 * Injects or updates required pool parameters in the connection URL
 */
export function buildPooledDatabaseUrl(rawUrl: string, config: PoolConfig): string {
  if (!rawUrl || (!rawUrl.startsWith('postgres://') && !rawUrl.startsWith('postgresql://'))) {
    return rawUrl;
  }

  try {
    const parsed = new URL(rawUrl);
    if (config.isPgBouncer) {
      parsed.searchParams.set('pgbouncer', 'true');
    }
    parsed.searchParams.set('connection_limit', config.connectionLimit.toString());
    parsed.searchParams.set('pool_timeout', config.poolTimeoutSeconds.toString());
    return parsed.toString();
  } catch {
    return rawUrl;
  }
}
