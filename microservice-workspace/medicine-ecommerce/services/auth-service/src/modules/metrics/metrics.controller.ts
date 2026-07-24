import { Controller, Get, Header, Injectable, OnModuleInit } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import * as promClient from 'prom-client';
import { Public } from '../../common/decorators/auth.decorators';

@Injectable()
export class MetricsService implements OnModuleInit {
  public readonly registry: promClient.Registry;
  public readonly httpRequestsTotal: promClient.Counter;
  public readonly httpRequestDuration: promClient.Histogram;
  public readonly loginAttemptsTotal: promClient.Counter;
  public readonly registrationsTotal: promClient.Counter;
  public readonly accountLockoutsTotal: promClient.Counter;

  constructor() {
    this.registry = new promClient.Registry();
    this.registry.setDefaultLabels({ service: 'auth-service' });

    this.httpRequestsTotal = new promClient.Counter({
      name: 'http_requests_total',
      help: 'Total HTTP requests',
      labelNames: ['method', 'route', 'status'],
      registers: [this.registry],
    });

    this.httpRequestDuration = new promClient.Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route', 'status'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.registry],
    });

    this.loginAttemptsTotal = new promClient.Counter({
      name: 'auth_login_attempts_total',
      help: 'Total login attempts',
      labelNames: ['result'], 
      registers: [this.registry],
    });

    this.registrationsTotal = new promClient.Counter({
      name: 'auth_registrations_total',
      help: 'Total user registrations',
      registers: [this.registry],
    });

    this.accountLockoutsTotal = new promClient.Counter({
      name: 'auth_account_lockouts_total',
      help: 'Total account lockouts',
      registers: [this.registry],
    });
  }

  onModuleInit() {
    promClient.collectDefaultMetrics({ register: this.registry });
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }
}

@ApiTags('Metrics')
@Controller()
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Public()
  @Get('metrics')
  @Header('Content-Type', 'text/plain; charset=utf-8')
  @ApiOperation({ summary: 'Prometheus metrics endpoint' })
  async metrics() {
    return this.metricsService.getMetrics();
  }
}
