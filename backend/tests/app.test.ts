import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();

describe('app-level behavior', () => {
  it('returns 404 JSON for an unknown route', async () => {
    const response = await request(app).get('/api/does-not-exist');
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Not found' });
  });

  it('supports the full public flow: list courses, view detail, submit enrollment', async () => {
    const listResponse = await request(app).get('/api/courses');
    const firstSlug = listResponse.body[0].slug as string;

    const detailResponse = await request(app).get(`/api/courses/${firstSlug}`);
    expect(detailResponse.status).toBe(200);

    const enrollResponse = await request(app)
      .post('/api/enrollments')
      .send({ courseId: detailResponse.body.id, name: 'Smoke Test', email: 'smoke@example.com' });
    expect(enrollResponse.status).toBe(201);
  });
});
