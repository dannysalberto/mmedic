import { HealthService } from './health.service';
import { PrismaMetricsService } from '../../prisma/prisma-metrics.service';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export async function runHealthServiceTests() {
  console.log('Running Health Service Tests...');

  const metricsService = new PrismaMetricsService();
  metricsService.setPoolLimit(10);

  // Mock PrismaService ping
  const mockPrismaService: any = {
    ping: async () => ({ connected: true, latencyMs: 8.5 }),
  };

  const healthService = new HealthService(mockPrismaService, metricsService);
  const healthResponse = await healthService.check();

  assert(healthResponse.status === 'ok', 'Status should be ok when db is connected and healthy');
  assert(healthResponse.database.status === 'connected', 'Database status should be connected');
  assert(healthResponse.database.latencyMs === 8.5, 'Latency should be 8.5ms');
  assert(healthResponse.database.pool.limit === 10, 'Pool limit should be 10');
  assert(healthResponse.database.pool.saturationWarning === false, 'Saturation warning should be false');

  // Test degraded state when saturation >= 80%
  for (let i = 0; i < 8; i++) {
    metricsService.recordQueryStart();
  }
  const degradedResponse = await healthService.check();
  assert(degradedResponse.status === 'degraded', 'System status should be degraded when pool >= 80%');
  assert(degradedResponse.database.status === 'degraded', 'Database status should be degraded when pool >= 80%');
  assert(degradedResponse.database.pool.saturationWarning === true, 'Pool saturationWarning should be true');

  // Test disconnected state
  mockPrismaService.ping = async () => ({ connected: false, latencyMs: -1 });
  const disconnectedResponse = await healthService.check();
  assert(disconnectedResponse.status === 'error', 'Status should be error when db is disconnected');
  assert(disconnectedResponse.database.status === 'disconnected', 'Database status should be disconnected');

  console.log('✓ All Health Service Tests Passed!');
}

if (require.main === module) {
  runHealthServiceTests().catch((err) => {
    console.error('Health Service test failed:', err);
    process.exit(1);
  });
}
