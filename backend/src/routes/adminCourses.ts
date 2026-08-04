import { Router } from 'express';
import { z } from 'zod';
import { Prisma } from '@rangewebsite/database';
import { prisma } from '../db.js';
import { INSTRUCTORS_INCLUDE, serializeCourse } from './courses.js';

export const adminCoursesRouter = Router();

const overviewRowSchema = z.object({ label: z.string(), value: z.string() });
const scheduleRowSchema = z.object({
  week: z.string(),
  day: z.string(),
  time: z.string(),
  coverage: z.string(),
});
const teamRoleSchema = z.object({
  role: z.string(),
  qty: z.string(),
  responsibility: z.string(),
});
const certificateSchema = z.object({
  name: z.string(),
  description: z.string(),
  criteria: z.array(z.object({ label: z.string(), weightPercent: z.number() })),
});

const courseInputSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  shortDescription: z.string().min(1),
  status: z.enum(['UPCOMING', 'OFFERED', 'COMPLETED']),
  featured: z.boolean().optional(),
  displayOrder: z.number().int().optional(),

  durationHours: z.number().int().nullable().optional(),
  durationText: z.string().nullable().optional(),
  scheduleText: z.string().nullable().optional(),
  startDateText: z.string().nullable().optional(),
  periodText: z.string().nullable().optional(),
  feeText: z.string().nullable().optional(),
  level: z.string().nullable().optional(),

  // Json columns: omit the field to leave it unset rather than passing an
  // explicit null (Prisma requires the Prisma.JsonNull sentinel for that,
  // which isn't worth exposing through this API yet).
  overview: z.array(overviewRowSchema).optional(),
  about: z.array(z.string()).optional(),
  takeaways: z.array(z.string()).optional(),
  audience: z.array(z.string()).optional(),
  prerequisites: z.array(z.string()).optional(),
  courseSchedule: z.array(scheduleRowSchema).optional(),
  scheduleNotes: z.array(z.string()).optional(),
  trainingTeam: z.array(teamRoleSchema).optional(),
  trainingTeamNotes: z.array(z.string()).optional(),
  certificate: certificateSchema.optional(),
  confirmationNotes: z.array(z.string()).optional(),
});

adminCoursesRouter.get('/', async (_req, res) => {
  const courses = await prisma.course.findMany({
    orderBy: { displayOrder: 'asc' },
    include: INSTRUCTORS_INCLUDE,
  });
  res.json(courses.map(serializeCourse));
});

adminCoursesRouter.post('/', async (req, res) => {
  const parsed = courseInputSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid course data', details: parsed.error.flatten() });
    return;
  }

  try {
    const course = await prisma.course.create({
      data: parsed.data,
      include: INSTRUCTORS_INCLUDE,
    });
    res.status(201).json(serializeCourse(course));
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      res.status(409).json({ error: 'A course with this slug already exists' });
      return;
    }
    throw error;
  }
});

adminCoursesRouter.put('/:id', async (req, res) => {
  const parsed = courseInputSchema.partial().safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid course data', details: parsed.error.flatten() });
    return;
  }

  try {
    const course = await prisma.course.update({
      where: { id: req.params.id },
      data: parsed.data,
      include: INSTRUCTORS_INCLUDE,
    });
    res.json(serializeCourse(course));
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        res.status(404).json({ error: 'Course not found' });
        return;
      }
      if (error.code === 'P2002') {
        res.status(409).json({ error: 'A course with this slug already exists' });
        return;
      }
    }
    throw error;
  }
});

adminCoursesRouter.delete('/:id', async (req, res) => {
  try {
    await prisma.course.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      res.status(404).json({ error: 'Course not found' });
      return;
    }
    throw error;
  }
});
