import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

describe('API (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health', () => {
    it('GET / returns Hello World!', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect('Hello World!');
    });
  });

  describe('Auth', () => {
    it('POST /auth/login with invalid credentials returns 401', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'nonexistent@test.com', password: 'wrong' })
        .expect(401);
    });

    it('POST /auth/register without verifyToken returns 401', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'new@test.com',
          name: 'Test User',
          password: 'password123',
          verifyToken: 'invalid',
        })
        .expect(401);
    });

    it('GET /auth/me without token returns 401', () => {
      return request(app.getHttpServer())
        .get('/auth/me')
        .expect(401);
    });
  });

  describe('Categories', () => {
    it('GET /categories returns array', () => {
      return request(app.getHttpServer())
        .get('/categories')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('Vendors', () => {
    it('GET /vendors returns array', () => {
      return request(app.getHttpServer())
        .get('/vendors')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('GET /vendors/:id with invalid id returns 404', () => {
      return request(app.getHttpServer())
        .get('/vendors/nonexistent')
        .expect(404);
    });
  });

  describe('Services', () => {
    it('GET /services returns array', () => {
      return request(app.getHttpServer())
        .get('/services')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('Visitors', () => {
    it('POST /visitors creates a visitor', () => {
      return request(app.getHttpServer())
        .post('/visitors')
        .send({
          fullName: 'E2E Test Visitor',
          mobile: '+971500000000',
          email: 'e2e@test.com',
          city: 'Dubai',
          leadSource: 'Walk-in',
          interestedCategories: ['architecture'],
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.fullName).toBe('E2E Test Visitor');
          expect(res.body.stage).toBe('new');
        });
    });

    it('GET /visitors/:id returns visitor or 404', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/visitors')
        .send({ fullName: 'Findable Visitor', leadSource: 'Walk-in' });
      const id = createRes.body.id;

      return request(app.getHttpServer())
        .get(`/visitors/${id}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.fullName).toBe('Findable Visitor');
        });
    });

    it('GET /visitors/:id with invalid id returns 404', () => {
      return request(app.getHttpServer())
        .get('/visitors/bad-id-123')
        .expect(404);
    });
  });

  describe('Admin', () => {
    it('GET /admin/stats without auth returns 401', () => {
      return request(app.getHttpServer())
        .get('/admin/stats')
        .expect(401);
    });

    it('GET /admin/visitors without auth returns 401', () => {
      return request(app.getHttpServer())
        .get('/admin/visitors')
        .expect(401);
    });

    it('GET /admin/users without auth returns 401', () => {
      return request(app.getHttpServer())
        .get('/admin/users')
        .expect(401);
    });
  });

  describe('Consultations', () => {
    it('GET /consultations without auth returns 401', () => {
      return request(app.getHttpServer())
        .get('/consultations')
        .expect(401);
    });
  });

  describe('Notifications', () => {
    it('GET /notifications without auth returns 401', () => {
      return request(app.getHttpServer())
        .get('/notifications')
        .expect(401);
    });
  });

  describe('Vendor Visits', () => {
    let visitorId: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/visitors')
        .send({ fullName: 'Visit Test Visitor', leadSource: 'Walk-in' });
      visitorId = res.body.id;
    });

    it('POST /visitors/:visitorId/vendor-visits/:vendorId records a visit', async () => {
      const res = await request(app.getHttpServer())
        .post(`/visitors/${visitorId}/vendor-visits/test-vendor-1`)
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.visitCount).toBe(1);
      expect(res.body.visitorId).toBe(visitorId);
      expect(res.body.vendorId).toBe('test-vendor-1');
    });

    it('POST same visit again increments visitCount', async () => {
      await request(app.getHttpServer())
        .post(`/visitors/${visitorId}/vendor-visits/test-vendor-2`)
        .expect(201);

      const second = await request(app.getHttpServer())
        .post(`/visitors/${visitorId}/vendor-visits/test-vendor-2`)
        .expect(201);

      expect(second.body.visitCount).toBe(2);
    });

    it('GET /visitors/:visitorId/vendor-visits returns visits', async () => {
      const res = await request(app.getHttpServer())
        .get(`/visitors/${visitorId}/vendor-visits`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(2);
    });
  });
});
