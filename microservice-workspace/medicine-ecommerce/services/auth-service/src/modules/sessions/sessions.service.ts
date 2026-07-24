import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from './entities/session.entity';
import { addDays } from '../../common/utils/crypto.util';

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepo: Repository<Session>,
  ) {}

  async create(data: {
    userId: string;
    ipAddress?: string;
    userAgent?: string;
    deviceId?: string;
    expiresInDays?: number;
  }): Promise<Session> {
    const session = this.sessionRepo.create({
      userId: data.userId,
      ipAddress: data.ipAddress ?? null,
      userAgent: data.userAgent ?? null,
      deviceId: data.deviceId ?? null,
      expiresAt: addDays(new Date(), data.expiresInDays ?? 7),
    });
    return this.sessionRepo.save(session);
  }

  async findById(id: string): Promise<Session | null> {
    return this.sessionRepo.findOne({ where: { id } });
  }

  async findActiveByUser(userId: string): Promise<Session[]> {
    return this.sessionRepo
      .createQueryBuilder('session')
      .where('session.userId = :userId', { userId })
      .andWhere('session.revokedAt IS NULL')
      .andWhere('session.expiresAt > :now', { now: new Date() })
      .orderBy('session.lastActiveAt', 'DESC')
      .getMany();
  }

  async revoke(id: string): Promise<void> {
    await this.sessionRepo.update(id, { revokedAt: new Date() });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.sessionRepo.update(
      { userId, revokedAt: undefined },
      { revokedAt: new Date() },
    );
  }

  async touch(id: string): Promise<void> {
    await this.sessionRepo.update(id, { lastActiveAt: new Date() });
  }
}
