import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserStatus } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { id } });
  }

  async findByIdOrFail(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email: email.toLowerCase() } });
  }

  async findByEmailWithSecrets(email: string): Promise<User | null> {
    return this.userRepo
      .createQueryBuilder('user')
      .addSelect('user.twoFactorSecret')
      .addSelect('user.twoFactorBackupCodes')
      .where('user.email = :email', { email: email.toLowerCase() })
      .getOne();
  }

  async findByIdWithSecrets(id: string): Promise<User | null> {
    return this.userRepo
      .createQueryBuilder('user')
      .addSelect('user.twoFactorSecret')
      .addSelect('user.twoFactorBackupCodes')
      .where('user.id = :id', { id })
      .getOne();
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.userRepo.count({
      where: { email: email.toLowerCase() },
    });
    return count > 0;
  }

  async create(data: Partial<User>): Promise<User> {
    if (data.email && (await this.existsByEmail(data.email))) {
      throw new ConflictException('Email is already registered');
    }
    const user = this.userRepo.create({
      ...data,
      email: data.email?.toLowerCase(),
    });
    return this.userRepo.save(user);
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    await this.userRepo.update(id, data);
    return this.findByIdOrFail(id);
  }

  async incrementFailedAttempts(id: string): Promise<void> {
    await this.userRepo.increment({ id }, 'failedLoginAttempts', 1);
  }

  async resetFailedAttempts(id: string): Promise<void> {
    await this.userRepo.update(id, {
      failedLoginAttempts: 0,
      lockedUntil: null,
    });
  }

  async lockAccount(id: string, until: Date): Promise<void> {
    await this.userRepo.update(id, { lockedUntil: until });
  }

  async markEmailVerified(id: string): Promise<void> {
    await this.userRepo.update(id, {
      emailVerified: true,
      emailVerifiedAt: new Date(),
      status: UserStatus.ACTIVE,
    });
  }

  async updateLastLogin(id: string, ip: string): Promise<void> {
    await this.userRepo.update(id, {
      lastLoginAt: new Date(),
      lastLoginIp: ip,
    });
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await this.userRepo.update(id, {
      passwordHash,
      passwordChangedAt: new Date(),
    });
  }
}
