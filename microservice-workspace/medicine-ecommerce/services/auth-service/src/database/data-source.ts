import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { User } from '../modules/users/entities/user.entity';
import { RefreshToken } from '../modules/tokens/entities/refresh-token.entity';
import { VerificationToken } from '../modules/tokens/entities/verification-token.entity';
import { Session } from '../modules/sessions/entities/session.entity';
import { AuditLog } from '../modules/audit/entities/audit-log.entity';

config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USER || 'auth_user',
  password: process.env.DATABASE_PASSWORD || 'auth_pass',
  database: process.env.DATABASE_NAME || 'auth_db',
  entities: [User, RefreshToken, VerificationToken, Session, AuditLog],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  migrationsTableName: 'migrations',
  synchronize: false,
  logging: process.env.DATABASE_LOGGING === 'true',
});

