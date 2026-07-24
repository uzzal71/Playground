import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User, UserRole, UserStatus } from './entities/user.entity';

describe('UsersService', () => {
  let service: UsersService;
  let repo: jest.Mocked<Repository<User>>;

  const mockUser: Partial<User> = {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: UserRole.CUSTOMER,
    status: UserStatus.ACTIVE,
    failedLoginAttempts: 0,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            count: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            increment: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repo = module.get(getRepositoryToken(User));
  });

  describe('findByIdOrFail', () => {
    it('returns user when found', async () => {
      repo.findOne.mockResolvedValue(mockUser as User);
      const result = await service.findByIdOrFail(mockUser.id!);
      expect(result).toEqual(mockUser);
    });

    it('throws NotFoundException when user not found', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findByIdOrFail('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates a new user when email is unique', async () => {
      repo.count.mockResolvedValue(0);
      repo.create.mockReturnValue(mockUser as User);
      repo.save.mockResolvedValue(mockUser as User);

      const result = await service.create({
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        passwordHash: 'hash',
      });

      expect(result).toEqual(mockUser);
      expect(repo.save).toHaveBeenCalled();
    });

    it('throws ConflictException when email already exists', async () => {
      repo.count.mockResolvedValue(1);
      await expect(
        service.create({ email: 'test@example.com' } as any),
      ).rejects.toThrow(ConflictException);
    });
  });
});
