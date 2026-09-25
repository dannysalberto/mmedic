import { Prisma } from '@prisma/client';
import { PrismaMetricsService } from './prisma-metrics.service';
import { PoolConfig } from './prisma-pool.config';

/**
 * Creates the resilience extension for Prisma Client.
 * Governs:
 * - FR-011: Strict pagination clamp to max 100 records on findMany operations.
 * - FR-006: Exponential backoff retries for idempotent read queries encountering transient drops.
 * - FR-005/008: Real-time query performance and active connection telemetry.
 */
export function createPrismaPoolExtension(
  metricsService: PrismaMetricsService,
  config: PoolConfig,
) {
  return Prisma.defineExtension((client) => {
    return client.$extends({
      name: 'prisma-pool-resilience-extension',
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            // FR-011: Enforce mandatory pagination clamp on findMany
            if (operation === 'findMany') {
              const currentArgs = (args || {}) as { take?: number; [key: string]: any };
              const requestedTake = currentArgs.take;

              if (requestedTake === undefined || requestedTake > config.maxPaginationLimit) {
                currentArgs.take = config.maxPaginationLimit;
              }
              args = currentArgs;
            }

            // Telemetry tracking: query started
            const finishTimer = metricsService.recordQueryStart();

            // Operations eligible for transient network retries (idempotent reads only)
            const isIdempotentRead = [
              'findUnique',
              'findFirst',
              'findMany',
              'count',
              'aggregate',
              'groupBy',
            ].includes(operation);

            let attempts = 0;
            const maxAttempts = isIdempotentRead ? config.maxRetries + 1 : 1;

            while (attempts < maxAttempts) {
              attempts++;
              try {
                const result = await query(args);
                finishTimer();
                return result;
              } catch (error: any) {
                const isLastAttempt = attempts >= maxAttempts;

                const isTransientError =
                  isIdempotentRead &&
                  (error.code === 'P1001' ||
                    error.code === 'P1002' ||
                    error.message?.includes('ECONNRESET') ||
                    error.message?.includes('ETIMEDOUT') ||
                    error.message?.includes('connection closed') ||
                    error.message?.includes("Can't reach database server"));

                if (isTransientError && !isLastAttempt) {
                  metricsService.recordRetry();
                  // Exponential backoff: 100ms for 1st retry, 300ms for 2nd retry
                  const backoffMs = attempts === 1 ? 100 : 300;
                  await new Promise((resolve) => setTimeout(resolve, backoffMs));
                  continue;
                }

                metricsService.recordQueryEnd(0, true);
                throw error;
              }
            }
          },
        },
      },
    });
  });
}
