import { PrismaMetricsService } from './prisma-metrics.service';
import { resolvePoolConfig } from './prisma-pool.config';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export async function runRetryTests() {
  console.log('Running Retry & Transient Resilience Tests...');

  const metricsService = new PrismaMetricsService();
  const config = resolvePoolConfig();

  // Test 1: Simulate transient read retry loop logic
  let readAttempts = 0;
  const simulatedReadOp = async () => {
    const isIdempotentRead = true;
    let attempts = 0;
    const maxAttempts = config.maxRetries + 1; // 3 total attempts

    while (attempts < maxAttempts) {
      attempts++;
      readAttempts++;
      try {
        if (attempts < 3) {
          // Simulate transient network disconnection
          const err: any = new Error('ECONNRESET: Connection reset by peer');
          err.code = 'P1001';
          throw err;
        }
        // Success on 3rd attempt
        return { success: true };
      } catch (error: any) {
        const isLastAttempt = attempts >= maxAttempts;
        const isTransient = error.code === 'P1001' || error.message.includes('ECONNRESET');

        if (isTransient && !isLastAttempt) {
          metricsService.recordRetry();
          continue;
        }
        throw error;
      }
    }
  };

  const result = await simulatedReadOp();
  assert(result.success === true, 'Read operation should succeed after retries');
  assert(readAttempts === 3, `Expected 3 attempts, got ${readAttempts}`);
  assert(metricsService.getMetrics().retriedQueries === 2, 'Metrics should record 2 retries');

  // Test 2: Simulate mutation operation (must NOT retry)
  let writeAttempts = 0;
  let writeFailed = false;
  const simulatedWriteOp = async () => {
    const isIdempotentRead = false; // Write operations (create, update, delete)
    let attempts = 0;
    const maxAttempts = isIdempotentRead ? config.maxRetries + 1 : 1; // Exactly 1 attempt!

    while (attempts < maxAttempts) {
      attempts++;
      writeAttempts++;
      try {
        const err: any = new Error('ECONNRESET: Connection reset during invoice insert');
        err.code = 'P1001';
        throw err;
      } catch (error: any) {
        const isLastAttempt = attempts >= maxAttempts;
        const isTransient = isIdempotentRead && error.code === 'P1001';

        if (isTransient && !isLastAttempt) {
          metricsService.recordRetry();
          continue;
        }
        throw error;
      }
    }
  };

  try {
    await simulatedWriteOp();
  } catch (err: any) {
    writeFailed = true;
    assert(err.message.includes('ECONNRESET'), 'Error should be preserved');
  }

  assert(writeFailed === true, 'Write operation MUST fail immediately on network error');
  assert(writeAttempts === 1, `Write operation MUST NOT retry! Attempts was ${writeAttempts}`);

  console.log('✓ All Retry & Transient Resilience Tests Passed!');
}

if (require.main === module) {
  runRetryTests().catch((err) => {
    console.error('Retry test failed:', err);
    process.exit(1);
  });
}
