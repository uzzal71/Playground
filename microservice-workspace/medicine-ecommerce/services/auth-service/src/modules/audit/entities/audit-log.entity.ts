import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum AuditEventType {
  USER_REGISTERED = 'user.registered',
  USER_LOGIN_SUCCESS = 'user.login.success',
  USER_LOGIN_FAILED = 'user.login.failed',
  USER_LOGOUT = 'user.logout',
  USER_PASSWORD_CHANGED = 'user.password.changed',
  USER_PASSWORD_RESET_REQUESTED = 'user.password.reset.requested',
  USER_PASSWORD_RESET_COMPLETED = 'user.password.reset.completed',
  USER_EMAIL_VERIFICATION_SENT = 'user.email.verification.sent',
  USER_EMAIL_VERIFIED = 'user.email.verified',
  USER_ACCOUNT_LOCKED = 'user.account.locked',
  USER_ACCOUNT_UNLOCKED = 'user.account.unlocked',
  USER_2FA_ENABLED = 'user.2fa.enabled',
  USER_2FA_DISABLED = 'user.2fa.disabled',
  USER_2FA_VERIFIED = 'user.2fa.verified',
  USER_2FA_FAILED = 'user.2fa.failed',
  TOKEN_REFRESHED = 'token.refreshed',
  TOKEN_REVOKED = 'token.revoked',
  REFRESH_TOKEN_REUSE_DETECTED = 'token.reuse.detected',
  SESSION_REVOKED = 'session.revoked',
}

@Entity('audit_logs')
@Index(['userId'])
@Index(['eventType'])
@Index(['createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true, name: 'user_id' })
  userId: string | null;

  @ManyToOne(() => User, (user) => user.auditLogs, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  @Column({ type: 'enum', enum: AuditEventType, name: 'event_type' })
  eventType: AuditEventType;

  @Column({ type: 'varchar', length: 45, nullable: true, name: 'ip_address' })
  ipAddress: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'user_agent' })
  userAgent: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @Column({ type: 'boolean', default: true })
  success: boolean;

  @Column({ type: 'text', nullable: true, name: 'failure_reason' })
  failureReason: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
