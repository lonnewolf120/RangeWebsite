import 'dotenv/config';
import { describe, it, expect, afterAll } from 'vitest';
import { PrismaClient } from '../generated/client/index.js';

const prisma = new PrismaClient();

describe('database seed', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('seeds exactly 7 courses', async () => {
    const count = await prisma.course.count();
    expect(count).toBe(7);
  });

  it('marks exactly ceh-v12, vapt, and threat-hunting as featuredInHero, in that display order', async () => {
    const featured = await prisma.course.findMany({
      where: { featuredInHero: true },
      orderBy: { displayOrder: 'asc' },
    });
    expect(featured.map((c) => c.slug)).toEqual(['ceh-v12', 'vapt', 'threat-hunting']);
  });

  it('seeds exactly one admin user matching ADMIN_BOOTSTRAP_EMAIL', async () => {
    const count = await prisma.adminUser.count();
    expect(count).toBe(1);
    const admin = await prisma.adminUser.findUnique({
      where: { email: process.env.ADMIN_BOOTSTRAP_EMAIL },
    });
    expect(admin).not.toBeNull();
  });
});
