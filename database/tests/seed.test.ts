import 'dotenv/config';
import { describe, it, expect, afterAll } from 'vitest';
import { PrismaClient } from '../generated/client/index.js';

const prisma = new PrismaClient();

describe('database seed', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('seeds exactly 8 courses', async () => {
    const count = await prisma.course.count();
    expect(count).toBe(8);
  });

  it('marks exactly soc-analysis-threat-hunting as featured', async () => {
    const featured = await prisma.course.findMany({
      where: { featured: true },
      orderBy: { displayOrder: 'asc' },
    });
    expect(featured.map((c) => c.slug)).toEqual(['soc-analysis-threat-hunting']);
  });

  it('seeds staff members and links them to courses as instructors', async () => {
    const staffCount = await prisma.staffMember.count();
    expect(staffCount).toBe(3);

    const cehCourse = await prisma.course.findUnique({
      where: { slug: 'certified-ethical-hacker-ceh-v12' },
      include: { instructors: { include: { staff: true }, orderBy: { displayOrder: 'asc' } } },
    });
    expect(cehCourse?.instructors.map((i) => i.staff.name)).toEqual([
      'Mohammad Shahadat Hossain',
      'Md. Bahauddin Palash',
    ]);
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
