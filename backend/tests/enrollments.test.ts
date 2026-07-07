import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();

describe('POST /api/enrollments', () => {
  it('creates an enrollment with valid data', async () => {
    const response = await request(app)
      .post('/api/enrollments')
      .send({ name: 'Jane Doe', email: 'jane@example.com', message: 'Interested in CEH.' });
    expect(response.status).toBe(201);
    expect(response.body.status).toBe('NEW');
  });

  it('rejects an enrollment missing a required field', async () => {
    const response = await request(app).post('/api/enrollments').send({ name: 'No Email' });
    expect(response.status).toBe(400);
  });

  it('rejects an enrollment with an invalid email', async () => {
    const response = await request(app)
      .post('/api/enrollments')
      .send({ name: 'Bad Email', email: 'not-an-email' });
    expect(response.status).toBe(400);
  });
});
