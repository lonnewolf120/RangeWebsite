import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/db.js';

const app = createApp();

async function getAdminToken(): Promise<string> {
  const response = await request(app).post('/api/admin/login').send({
    email: process.env.ADMIN_BOOTSTRAP_EMAIL,
    password: process.env.ADMIN_BOOTSTRAP_PASSWORD,
  });
  return response.body.token as string;
}

describe('/api/admin/enrollments', () => {
  it('rejects requests without a token', async () => {
    const response = await request(app).get('/api/admin/enrollments');
    expect(response.status).toBe(401);
  });

  it('lists enrollments and updates status', async () => {
    const createResponse = await request(app)
      .post('/api/enrollments')
      .send({ name: 'Status Test', email: 'status-test@example.com' });
    const enrollmentId = createResponse.body.id as string;

    const token = await getAdminToken();

    const listResponse = await request(app)
      .get('/api/admin/enrollments')
      .set('Authorization', `Bearer ${token}`);
    expect(listResponse.status).toBe(200);
    expect(
      (listResponse.body as Array<{ id: string }>).some((e) => e.id === enrollmentId)
    ).toBe(true);

    const patchResponse = await request(app)
      .patch(`/api/admin/enrollments/${enrollmentId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'CONTACTED' });
    expect(patchResponse.status).toBe(200);
    expect(patchResponse.body.status).toBe('CONTACTED');
  });

  afterAll(async () => {
    await prisma.enrollment.deleteMany({ where: { email: 'status-test@example.com' } });
  });
});
