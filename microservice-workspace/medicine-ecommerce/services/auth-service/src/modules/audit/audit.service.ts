import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditEventType, AuditLog } from './entities/audit-log.entity';

export interface AuditLogInput {
  userId?: string | null;
  eventType: AuditEventType;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  success?: boolean;
  failureReason?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  async log(input: AuditLogInput): Promise<void> {
    try {
      const auditLog = this.auditRepo.create({
        userId: input.userId ?? null,
        eventType: input.eventType,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
        metadata: input.metadata ?? null,
        success: input.success ?? true,
        failureReason: input.failureReason ?? null,
      });
      await this.auditRepo.save(auditLog);
    } catch (err) {
      this.logger.error('Failed to write audit log', err);
    }
  }

  async getUserAuditLogs(userId: string, limit = 50): Promise<AuditLog[]> {
    return this.auditRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
