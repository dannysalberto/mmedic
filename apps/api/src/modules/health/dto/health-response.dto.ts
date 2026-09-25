import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DatabasePoolMetricsDto {
  @ApiProperty({ description: 'Configured connection pool limit for the active instance', example: 10 })
  limit: number;

  @ApiProperty({ description: 'Current in-flight queries executing against PostgreSQL', example: 2 })
  activeQueries: number;

  @ApiProperty({ description: 'Total queries executed since startup', example: 15420 })
  totalQueries: number;

  @ApiProperty({ description: 'Total query execution errors encountered', example: 0 })
  totalErrors: number;

  @ApiPropertyOptional({ description: 'Total read queries recovered via automatic retry', example: 1 })
  retriedQueries?: number;

  @ApiProperty({ description: 'True when active queries reach or exceed 80% capacity', example: false })
  saturationWarning: boolean;

  @ApiProperty({ description: 'Running 95th percentile query latency in milliseconds', example: 18.5 })
  p95LatencyMs: number;
}

export class DatabaseHealthInfoDto {
  @ApiProperty({ enum: ['connected', 'degraded', 'disconnected'], example: 'connected' })
  status: 'connected' | 'degraded' | 'disconnected';

  @ApiPropertyOptional({ description: 'Round-trip ping duration in milliseconds', example: 12.4 })
  latencyMs?: number;

  @ApiProperty({ type: DatabasePoolMetricsDto })
  pool: DatabasePoolMetricsDto;
}

export class DatabaseHealthResponseDto {
  @ApiProperty({ enum: ['ok', 'degraded', 'error'], example: 'ok' })
  status: 'ok' | 'degraded' | 'error';

  @ApiProperty({ example: 'mmedic-api' })
  service: string;

  @ApiProperty({ example: '1.0.0' })
  version: string;

  @ApiProperty({ description: 'Process uptime in seconds', example: 3600 })
  uptime: number;

  @ApiProperty({ type: DatabaseHealthInfoDto })
  database: DatabaseHealthInfoDto;

  @ApiProperty({ example: '2026-09-24T18:30:00.000Z' })
  timestamp: string;
}
