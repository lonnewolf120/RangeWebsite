import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();

describe('GET /api/courses', () => {
  it('returns all 8 courses sorted by displayOrder', async () => {
    const response = await request(app).get('/api/courses');
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(8);
    expect(response.body[0].slug).toBe('soc-analysis-threat-hunting');
  });

  it('marks exactly 1 course as featured', async () => {
    const response = await request(app).get('/api/courses');
    const featured = response.body.filter((c: { featured: boolean }) => c.featured);
    expect(featured).toHaveLength(1);
  });
});

describe('GET /api/courses/:slug', () => {
  it('returns full course detail for a known slug', async () => {
    const response = await request(app).get('/api/courses/certified-ethical-hacker-ceh-v12');
    expect(response.status).toBe(200);
    expect(response.body.title).toBe('Certified Ethical Hacker (CEH v12)');
    expect(response.body.about).toBeInstanceOf(Array);
    expect(response.body.instructors).toBeInstanceOf(Array);
    expect(response.body.instructors).toHaveLength(2);
    expect(response.body.instructors[0].name).toBe('Mohammad Shahadat Hossain');
  });

  it('returns 404 for an unknown slug', async () => {
    const response = await request(app).get('/api/courses/does-not-exist');
    expect(response.status).toBe(404);
  });
});
