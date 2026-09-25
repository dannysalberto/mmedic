import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PrismaMetricsService } from './prisma-metrics.service';

@Global()
@Module({
  providers: [PrismaService, PrismaMetricsService],
  exports: [PrismaService, PrismaMetricsService],
})
export class PrismaModule {}
