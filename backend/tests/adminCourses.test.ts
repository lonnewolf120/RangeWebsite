import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();
let duplicateSlugCourseId: string | undefined;

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
        title: 'Test Course',
        shortDescription: 'A test course.',
        status: 'OFFERED',
        displayOrder: 99,
      });
    expect(createResponse.status).toBe(201);
    expect(createResponse.body.instructors).toEqual([]);
    const courseId = createResponse.body.id as string;

    const updateResponse = await request(app)
      .put(`/api/admin/courses/${courseId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Updated Test Course' });
    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.title).toBe('Updated Test Course');

    const deleteResponse = await request(app)
      .delete(`/api/admin/courses/${courseId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(deleteResponse.status).toBe(204);
  });

  it('returns 404 when updating a nonexistent course', async () => {
    const token = await getAdminToken();
    const response = await request(app)
      .put('/api/admin/courses/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Does Not Exist' });
    expect(response.status).toBe(404);
  });

  it('returns 409 when creating a course with a duplicate slug', async () => {
    const token = await getAdminToken();
    const payload = {
      slug: 'duplicate-slug-test',
      title: 'First',
      shortDescription: 'First course.',
      status: 'OFFERED',
      displayOrder: 98,
    };

    const firstResponse = await request(app)
      .post('/api/admin/courses')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);
    expect(firstResponse.status).toBe(201);
    duplicateSlugCourseId = firstResponse.body.id as string;

    const secondResponse = await request(app)
      .post('/api/admin/courses')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);
    expect(secondResponse.status).toBe(409);
  });

  afterAll(async () => {
    if (duplicateSlugCourseId) {
      const token = await getAdminToken();
      await request(app)
        .delete(`/api/admin/courses/${duplicateSlugCourseId}`)
        .set('Authorization', `Bearer ${token}`);
    }
  });
});
