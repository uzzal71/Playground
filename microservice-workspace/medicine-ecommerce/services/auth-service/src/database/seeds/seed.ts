import 'reflect-metadata';
import { config } from 'dotenv';
import * as bcrypt from 'bcrypt';
import { AppDataSource } from '../data-source';
import { User, UserRole, UserStatus } from '../../modules/users/entities/user.entity';

config();

async function seed() {
  console.log('Connecting to database...');
  await AppDataSource.initialize();

  const userRepo = AppDataSource.getRepository(User);

  const testUsers = [
    {
      email: 'admin@example.com',
      password: 'AdminPass123!',
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
    },
    {
      email: 'customer@example.com',
      password: 'CustomerPass123!',
      firstName: 'John',
      lastName: 'Customer',
      role: UserRole.CUSTOMER,
    },
    {
      email: 'seller@example.com',
      password: 'SellerPass123!',
      firstName: 'Jane',
      lastName: 'Seller',
      role: UserRole.SELLER,
    },
    {
      email: 'rider@example.com',
      password: 'RiderPass123!',
      firstName: 'Bob',
      lastName: 'Rider',
      role: UserRole.RIDER,
    },
  ];

  for (const userData of testUsers) {
    const existing = await userRepo.findOne({ where: { email: userData.email } });
    if (existing) {
      console.log(`  - ${userData.email} already exists, skipping`);
      continue;
    }

    const passwordHash = await bcrypt.hash(userData.password, 12);
    const user = userRepo.create({
      email: userData.email,
      passwordHash,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      emailVerifiedAt: new Date(),
    });
    await userRepo.save(user);
    console.log(`  ✓ Created ${userData.email} (${userData.role})`);
    console.log(`    Password: ${userData.password}`);
  }

  await AppDataSource.destroy();
  console.log('Seed complete!');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
