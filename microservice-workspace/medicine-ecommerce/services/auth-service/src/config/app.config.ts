import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  logLevel: process.env.LOG_LEVEL || 'info',
  serviceName: process.env.SERVICE_NAME || 'auth-service',
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','),

  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),

  accountLockout: {
    maxAttempts: parseInt(process.env.ACCOUNT_LOCKOUT_MAX_ATTEMPTS || '5', 10),
    durationMinutes: parseInt(
      process.env.ACCOUNT_LOCKOUT_DURATION_MINUTES || '30',
      10,
    ),
  },

  tokens: {
    emailVerificationExpiresHours: parseInt(
      process.env.EMAIL_VERIFICATION_TOKEN_EXPIRES_HOURS || '24',
      10,
    ),
    passwordResetExpiresHours: parseInt(
      process.env.PASSWORD_RESET_TOKEN_EXPIRES_HOURS || '1',
      10,
    ),
  },

  throttle: {
    ttlSeconds: parseInt(process.env.THROTTLE_TTL_SECONDS || '60', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT || '10', 10),
  },
}));
