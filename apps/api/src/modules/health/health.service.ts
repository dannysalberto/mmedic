import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PrismaMetricsService } from '../../prisma/prisma-metrics.service';
import { DatabaseHealthResponse } from '@mmedic/types';

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly metricsService: PrismaMetricsService,
  ) {}

  async check(): Promise<DatabaseHealthResponse> {
    const pingResult = await this.prisma.ping();
    const poolMetrics = this.metricsService.getMetrics();

    const dbStatus: 'connected' | 'degraded' | 'disconnected' =
      !pingResult.connected
        ? 'disconnected'
        : poolMetrics.saturationWarning
          ? 'degraded'
          : 'connected';

    const systemStatus: 'ok' | 'degraded' | 'error' =
      dbStatus === 'disconnected'
        ? 'error'
        : dbStatus === 'degraded'
          ? 'degraded'
          : 'ok';

    return {
      status: systemStatus,
      service: 'mmedic-api',
      version: '1.0.0',
      uptime: Math.floor(process.uptime()),
      database: {
        status: dbStatus,
        latencyMs: pingResult.latencyMs >= 0 ? pingResult.latencyMs : undefined,
        pool: poolMetrics,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
