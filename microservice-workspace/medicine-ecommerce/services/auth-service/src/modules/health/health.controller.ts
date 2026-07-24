import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/auth.decorators';

@ApiTags('Health')
@Controller()
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
  ) {}

  @Public()
  @Get('health')
  @HealthCheck()
  @ApiOperation({ summary: 'Liveness check' })
  liveness(): Promise<{ status: string; info?: any; details: any }> {
    return this.health.check([
      async (): Promise<HealthIndicatorResult> => ({
        service: { status: 'up' },
      }),
    ]);
  }

  @Public()
  @Get('ready')
  @HealthCheck()
  @ApiOperation({ summary: 'Readiness check (DB connectivity)' })
  readiness() {
    return this.health.check([() => this.db.pingCheck('database', { timeout: 3000 })]);
  }
}
