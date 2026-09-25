import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaMetricsService } from './prisma-metrics.service';
import {
  resolvePoolConfig,
  buildPooledDatabaseUrl,
  PoolConfig,
} from './prisma-pool.config';
import { createPrismaPoolExtension } from './prisma-pool.extension';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  public readonly poolConfig: PoolConfig;
  private readonly extendedClient: any;

  constructor(private readonly metricsService: PrismaMetricsService) {
    const config = resolvePoolConfig();
    const rawUrl = process.env.DATABASE_URL || '';
    const hasValidUrl = Boolean(
      rawUrl && (rawUrl.startsWith('postgres://') || rawUrl.startsWith('postgresql://')),
    );
    const effectiveUrl = hasValidUrl
      ? buildPooledDatabaseUrl(rawUrl, config)
      : 'postgresql://unconfigured_db:unconfigured_db@127.0.0.1:5432/mmedic?connect_timeout=1';

    if (hasValidUrl) {
      // Synchronize process.env so any downstream consumers share the pooled configuration
      process.env.DATABASE_URL = effectiveUrl;
    }

    super({
      datasources: {
        db: {
          url: effectiveUrl,
        },
      },
      log:
        process.env.NODE_ENV === 'development'
          ? ['warn', 'error']
          : ['error'],
    });

    this.poolConfig = config;
    this.metricsService.setPoolLimit(config.connectionLimit);

    // Instantiate extension for query clamping, retries, and telemetry
    this.extendedClient = this.$extends(
      createPrismaPoolExtension(this.metricsService, this.poolConfig),
    );

    // Transparent proxy: route all delegate queries through the extended client
    return new Proxy(this, {
      get(target, prop, receiver) {
        if (prop in target.extendedClient) {
          const value = target.extendedClient[prop];
          if (typeof value === 'function') {
            return value.bind(target.extendedClient);
          }
          return value;
        }
        return Reflect.get(target, prop, receiver);
      },
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();

      // Proactive connection verification (FR-009, SC-007)
      const start = Date.now();
      await this.$queryRaw`SELECT 1`;
      const pingMs = Date.now() - start;

      this.logger.log(
        `[Database Pool Initialized] Connected to PostgreSQL in ${pingMs}ms. ` +
          `PgBouncer: ${this.poolConfig.isPgBouncer ? 'ENABLED (Port 6543)' : 'DISABLED'}, ` +
          `Pool Limit: ${this.poolConfig.connectionLimit}, ` +
          `Pool Timeout: ${this.poolConfig.poolTimeoutSeconds}s, ` +
          `Max Pagination Clamp: ${this.poolConfig.maxPaginationLimit}`,
      );
    } catch (error: any) {
      this.logger.warn(
        `Could not connect to PostgreSQL on startup: ${error.message}. Ensure PostgreSQL is accessible.`,
      );
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
      this.logger.log('Disconnected cleanly from PostgreSQL connection pool');
    } catch (error: any) {
      this.logger.error(`Error during database disconnect: ${error.message}`);
    }
  }

  /**
   * Safe interactive transaction wrapper enforcing strict acquisition and execution timeouts (FR-007)
   */
  async $safeTransaction<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
    options?: { maxWait?: number; timeout?: number },
  ): Promise<T> {
    const maxWait = options?.maxWait ?? this.poolConfig.transactionMaxWaitMs;
    const timeout = options?.timeout ?? this.poolConfig.transactionTimeoutMs;

    const finishTimer = this.metricsService.recordQueryStart();
    try {
      const result = await (this as any).$transaction(fn, { maxWait, timeout });
      finishTimer();
      return result;
    } catch (error) {
      this.metricsService.recordQueryEnd(0, true);
      throw error;
    }
  }

  /**
   * Quick connection ping returning latency in ms without locking resources
   */
  async ping(): Promise<{ connected: boolean; latencyMs: number }> {
    const start = Date.now();
    try {
      await this.$queryRaw`SELECT 1`;
      return { connected: true, latencyMs: Date.now() - start };
    } catch {
      return { connected: false, latencyMs: -1 };
    }
  }
}
