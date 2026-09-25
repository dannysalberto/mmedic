import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';
import { DatabaseHealthResponseDto } from './dto/health-response.dto';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Check API and PostgreSQL connectivity with connection pool telemetry',
  })
  @ApiResponse({
    status: 200,
    description: 'System health check response with real-time pool metrics',
    type: DatabaseHealthResponseDto,
  })
  async getHealth() {
    return this.healthService.check();
  }
}
