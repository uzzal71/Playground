import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';

import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import {
  emailConfig,
  rabbitmqConfig,
  redisConfig,
  twoFactorConfig,
} from './config/infrastructure.config';
import { validate } from './config/env.validation';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TokensModule } from './modules/tokens/tokens.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { TwoFactorModule } from './modules/two-factor/two-factor.module';
import { EmailModule } from './modules/email/email.module';
import { EventsModule } from './modules/events/events.module';
import { AuditModule } from './modules/audit/audit.module';
import { JwksModule } from './modules/jwks/jwks.module';
import { HealthModule } from './modules/health/health.module';
import { MetricsModule } from './modules/metrics/metrics.module';

import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { JwtAuthGuard, RolesGuard } from './common/guards/auth.guards';
import { MetricsInterceptor } from './common/interceptors/metrics.interceptor';

import { User } from './modules/users/entities/user.entity';
import { RefreshToken } from './modules/tokens/entities/refresh-token.entity';
import { VerificationToken } from './modules/tokens/entities/verification-token.entity';
import { Session } from './modules/sessions/entities/session.entity';
import { AuditLog } from './modules/audit/entities/audit-log.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        databaseConfig,
        jwtConfig,
        redisConfig,
        rabbitmqConfig,
        emailConfig,
        twoFactorConfig,
      ],
      validate,
    }),

    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        pinoHttp: {
          level: config.get<string>('app.logLevel', 'info'),
          transport:
            config.get<string>('app.nodeEnv') === 'development'
              ? { target: 'pino-pretty', options: { singleLine: true } }
              : undefined,
          customProps: () => ({
            service: config.get<string>('app.serviceName'),
          }),
          serializers: {
            req: (req: any) => ({
              id: req.id,
              method: req.method,
              url: req.url,
              requestId: req.headers['x-request-id'],
            }),
          },
          autoLogging: {
            ignore: (req: any) =>
              req.url === '/health' ||
              req.url === '/ready' ||
              req.url === '/metrics',
          },
        },
      }),
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        ...config.get('database'),
        entities: [User, RefreshToken, VerificationToken, Session, AuditLog],
        autoLoadEntities: true,
      }),
    }),

    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('app.throttle.ttlSeconds', 60) * 1000,
          limit: config.get<number>('app.throttle.limit', 10),
        },
      ],
    }),

    EventsModule,
    EmailModule,
    MetricsModule,
    AuditModule,
    UsersModule,
    TokensModule,
    SessionsModule,
    TwoFactorModule,
    AuthModule,
    JwksModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: MetricsInterceptor },
  ],
})
export class AppModule {}
