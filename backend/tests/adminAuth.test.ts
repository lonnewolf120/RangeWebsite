import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();

describe('POST /api/admin/login', () => {
  it('returns a token for valid admin credentials', async () => {
    const response = await request(app).post('/api/admin/login').send({
      email: process.env.ADMIN_BOOTSTRAP_EMAIL,
      password: process.env.ADMIN_BOOTSTRAP_PASSWORD,
    });
    expect(response.status).toBe(200);
    expect(typeof response.body.token).toBe('string');
  });

  it('rejects an unknown email', async () => {
    const response = await request(app)
      .post('/api/admin/login')
      .send({ email: 'nobody@example.com', password: 'whatever' });
    expect(response.status).toBe(401);
  });

  it('rejects a wrong password', async () => {
    const response = await request(app)
      .post('/api/admin/login')
      .send({ email: process.env.ADMIN_BOOTSTRAP_EMAIL, password: 'wrong-password' });
    expect(response.status).toBe(401);
  });
});
