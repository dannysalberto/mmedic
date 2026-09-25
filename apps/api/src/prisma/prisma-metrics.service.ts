import { Injectable, Logger } from '@nestjs/common';
import { DatabasePoolMetrics } from '@mmedic/types';

const LATENCY_BUFFER_SIZE = 100;
const SATURATION_THRESHOLD = 0.8; // 80% per FR-008

@Injectable()
export class PrismaMetricsService {
  private readonly logger = new Logger(PrismaMetricsService.name);

  private poolLimit = 10;
  private activeQueriesCount = 0;
  private totalQueriesCount = 0;
  private totalErrorsCount = 0;
  private retriedQueriesCount = 0;
  private latencyBuffer: number[] = [];
  private lastWarningTimestamp = 0;

  setPoolLimit(limit: number) {
    if (limit > 0) {
      this.poolLimit = limit;
    }
  }

  recordQueryStart(): () => void {
    this.activeQueriesCount++;
    this.totalQueriesCount++;

    const saturationRatio = this.activeQueriesCount / this.poolLimit;
    if (saturationRatio >= SATURATION_THRESHOLD) {
      const now = Date.now();
      // Rate limit warning log to once every 5 seconds to prevent log spamming
      if (now - this.lastWarningTimestamp > 5000) {
        this.lastWarningTimestamp = now;
        this.logger.warn(
          `[Pool Saturation Warning] Active queries (${this.activeQueriesCount}/${this.poolLimit}) reached ` +
            `${Math.round(saturationRatio * 100)}% of connection pool capacity.`,
        );
      }
    }

    const startTime = Date.now();

    return () => {
      const durationMs = Date.now() - startTime;
      this.recordQueryEnd(durationMs, false);
    };
  }

  recordQueryEnd(durationMs: number, isError = false) {
    if (this.activeQueriesCount > 0) {
      this.activeQueriesCount--;
    }

    if (isError) {
      this.totalErrorsCount++;
    }

    this.latencyBuffer.push(durationMs);
    if (this.latencyBuffer.length > LATENCY_BUFFER_SIZE) {
      this.latencyBuffer.shift();
    }
  }

  recordRetry() {
    this.retriedQueriesCount++;
    this.logger.debug(`[Pool Retry] Transient query retry recorded. Total: ${this.retriedQueriesCount}`);
  }

  calculateP95Latency(): number {
    if (this.latencyBuffer.length === 0) {
      return 0;
    }

    const sorted = [...this.latencyBuffer].sort((a, b) => a - b);
    const p95Index = Math.min(
      Math.floor(sorted.length * 0.95),
      sorted.length - 1,
    );
    return Math.round((sorted[p95Index] ?? 0) * 10) / 10;
  }

  getMetrics(): DatabasePoolMetrics {
    const saturationPercentage = (this.activeQueriesCount / this.poolLimit) * 100;

    return {
      limit: this.poolLimit,
      activeQueries: this.activeQueriesCount,
      totalQueries: this.totalQueriesCount,
      totalErrors: this.totalErrorsCount,
      retriedQueries: this.retriedQueriesCount,
      saturationWarning: saturationPercentage >= SATURATION_THRESHOLD * 100,
      p95LatencyMs: this.calculateP95Latency(),
    };
  }
}
