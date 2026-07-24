import { registerAs } from '@nestjs/config';

export const redisConfig = registerAs('redis', () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0', 10),
}));

export const rabbitmqConfig = registerAs('rabbitmq', () => ({
  url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
  exchange: process.env.RABBITMQ_EXCHANGE || 'user.events',
}));

export const emailConfig = registerAs('email', () => ({
  smtp: {
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASSWORD || '',
    },
  },
  from: {
    name: process.env.SMTP_FROM_NAME || 'Medicine Store',
    email: process.env.SMTP_FROM_EMAIL || 'noreply@medicine-store.com',
  },
}));

export const twoFactorConfig = registerAs('twoFactor', () => ({
  appName: process.env.TWO_FACTOR_APP_NAME || 'MedicineEcommerce',
  window: parseInt(process.env.TWO_FACTOR_WINDOW || '1', 10),
}));
