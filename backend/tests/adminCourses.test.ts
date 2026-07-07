import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();

async function getAdminToken(): Promise<string> {
  const response = await request(app).post('/api/admin/login').send({
    email: process.env.ADMIN_BOOTSTRAP_EMAIL,
    password: process.env.ADMIN_BOOTSTRAP_PASSWORD,
  });
  return response.body.token as string;
}

describe('/api/admin/courses', () => {
  it('rejects requests without a token', async () => {
    const response = await request(app).get('/api/admin/courses');
    expect(response.status).toBe(401);
  });

  it('creates, updates, and deletes a course', async () => {
    const token = await getAdminToken();

    const createResponse = await request(app)
      .post('/api/admin/courses')
      .set('Authorization', `Bearer ${token}`)
      .send({
        slug: 'test-course',
        name: 'Test Course',
        shortDescription: 'A test course.',
        description: 'Full description.',
        targetAudience: 'Testers.',
        durationLabel: '1 day',
        curriculumHighlights: ['Module 1'],
        displayOrder: 99,
      });
    expect(createResponse.status).toBe(201);
    const courseId = createResponse.body.id as string;

    const updateResponse = await request(app)
      .put(`/api/admin/courses/${courseId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Test Course' });
    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.name).toBe('Updated Test Course');

    const deleteResponse = await request(app)
      .delete(`/api/admin/courses/${courseId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(deleteResponse.status).toBe(204);
  });
});
