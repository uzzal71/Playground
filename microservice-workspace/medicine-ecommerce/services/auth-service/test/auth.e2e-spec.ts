import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Auth E2E', () => {
  let app: INestApplication;

  const testUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'StrongPass123!',
    firstName: 'Test',
    lastName: 'User',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    app.setGlobalPrefix('api', {
      exclude: ['health', 'ready', 'metrics', '.well-known/(.*)'],
    });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health returns 200', async () => {
    return request(app.getHttpServer()).get('/health').expect(200);
  });

  it('GET /.well-known/jwks.json returns valid JWKS', async () => {
    const res = await request(app.getHttpServer())
      .get('/.well-known/jwks.json')
      .expect(200);

    expect(res.body).toHaveProperty('keys');
    expect(Array.isArray(res.body.keys)).toBe(true);
    expect(res.body.keys[0]).toHaveProperty('kid');
    expect(res.body.keys[0]).toHaveProperty('alg', 'RS256');
  });

  it('POST /api/v1/auth/register creates a user', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(testUser)
      .expect(201);

    expect(res.body).toHaveProperty('userId');
    expect(res.body.message).toContain('Registration successful');
  });

  it('POST /api/v1/auth/login fails when email not verified', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(401);
  });

  it('POST /api/v1/auth/login fails with wrong password', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: testUser.email, password: 'WrongPassword!' })
      .expect(401);
  });

  it('POST /api/v1/auth/register rejects weak password', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ ...testUser, email: 'weak@example.com', password: 'weak' })
      .expect(400);
  });

  it('POST /api/v1/auth/register rejects duplicate email', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(testUser)
      .expect(409);
  });

  it('GET /api/v1/auth/me requires auth', async () => {
    await request(app.getHttpServer()).get('/api/v1/auth/me').expect(401);
  });
});
