import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();

describe('GET /api/courses', () => {
  it('returns all 7 courses sorted by displayOrder', async () => {
    const response = await request(app).get('/api/courses');
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(7);
    expect(response.body[0].slug).toBe('ceh-v12');
  });

  it('marks exactly 3 courses as featuredInHero', async () => {
    const response = await request(app).get('/api/courses');
    const featured = response.body.filter((c: { featuredInHero: boolean }) => c.featuredInHero);
    expect(featured).toHaveLength(3);
  });
});

describe('GET /api/courses/:slug', () => {
  it('returns full course detail for a known slug', async () => {
    const response = await request(app).get('/api/courses/ceh-v12');
    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Certified Ethical Hacker (CEH) v12');
    expect(response.body.curriculumHighlights).toBeInstanceOf(Array);
  });

  it('returns 404 for an unknown slug', async () => {
    const response = await request(app).get('/api/courses/does-not-exist');
    expect(response.status).toBe(404);
  });
});
