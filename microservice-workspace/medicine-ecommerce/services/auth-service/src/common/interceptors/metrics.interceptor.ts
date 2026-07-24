import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { MetricsService } from '../../modules/metrics/metrics.controller';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const request = http.getRequest();
    const response = http.getResponse();
    const route = request.route?.path || request.url;
    const method = request.method;

    const endTimer = this.metricsService.httpRequestDuration.startTimer({
      method,
      route,
    });

    return next.handle().pipe(
      tap({
        next: () => {
          const status = response.statusCode;
          this.metricsService.httpRequestsTotal.inc({ method, route, status });
          endTimer({ status });
        },
        error: (err) => {
          const status = err?.status || 500;
          this.metricsService.httpRequestsTotal.inc({ method, route, status });
          endTimer({ status });
        },
      }),
    );
  }
}
