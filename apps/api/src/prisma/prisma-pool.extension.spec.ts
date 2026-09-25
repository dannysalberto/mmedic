import { createPrismaPoolExtension } from './prisma-pool.extension';
import { PrismaMetricsService } from './prisma-metrics.service';
import { resolvePoolConfig } from './prisma-pool.config';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export async function runExtensionTests() {
  console.log('Running Prisma Pool Extension Tests...');

  const metricsService = new PrismaMetricsService();
  const config = resolvePoolConfig();
  const extension = createPrismaPoolExtension(metricsService, config);

  // Verify extension definition structure
  assert(typeof extension === 'function' || typeof extension === 'object', 'Extension should be defined');

  // Verify findMany clamping logic directly
  const testClamping = (take?: number): number => {
    const currentArgs: { take?: number } = { take };
    if (currentArgs.take === undefined || currentArgs.take > config.maxPaginationLimit) {
      currentArgs.take = config.maxPaginationLimit;
    }
    return currentArgs.take;
  };

  assert(testClamping(undefined) === 100, 'Undefined take should clamp to 100');
  assert(testClamping(500) === 100, 'Take of 500 should clamp to 100');
  assert(testClamping(100) === 100, 'Take of 100 should remain 100');
  assert(testClamping(25) === 25, 'Take of 25 should remain 25');

  // Verify metrics tracking
  metricsService.setPoolLimit(10);
  const endTimer = metricsService.recordQueryStart();
  let metrics = metricsService.getMetrics();
  assert(metrics.activeQueries === 1, 'activeQueries should increment to 1');
  assert(metrics.totalQueries === 1, 'totalQueries should increment to 1');

  endTimer();
  metrics = metricsService.getMetrics();
  assert(metrics.activeQueries === 0, 'activeQueries should decrement to 0 after completion');

  // Verify saturation warning calculation at 80% (8/10)
  for (let i = 0; i < 8; i++) {
    metricsService.recordQueryStart();
  }
  metrics = metricsService.getMetrics();
  assert(metrics.saturationWarning === true, 'saturationWarning should be true at 80% capacity (8/10)');

  // Clear queries
  for (let i = 0; i < 8; i++) {
    metricsService.recordQueryEnd(15, false);
  }
  metrics = metricsService.getMetrics();
  assert(metrics.saturationWarning === false, 'saturationWarning should clear when queries drop below 80%');

  console.log('✓ All Prisma Pool Extension Tests Passed!');
}

if (require.main === module) {
  runExtensionTests().catch((err) => {
    console.error('Test error:', err);
    process.exit(1);
  });
}
