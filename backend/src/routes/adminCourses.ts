import { Router } from 'express';
import { z } from 'zod';
import { Prisma } from '@rangewebsite/database';
import { prisma } from '../db.js';

export const adminCoursesRouter = Router();

const courseInputSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  shortDescription: z.string().min(1),
  description: z.string().min(1),
  targetAudience: z.string().min(1),
  durationLabel: z.string().min(1),
  curriculumHighlights: z.array(z.string()),
  fee: z.string().nullable().optional(),
  featuredInHero: z.boolean().optional(),
  displayOrder: z.number().int(),
});

adminCoursesRouter.get('/', async (_req, res) => {
  const courses = await prisma.course.findMany({ orderBy: { displayOrder: 'asc' } });
  res.json(courses);
});

adminCoursesRouter.post('/', async (req, res) => {
  const parsed = courseInputSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid course data', details: parsed.error.flatten() });
    return;
  }

  try {
    const course = await prisma.course.create({ data: parsed.data });
    res.status(201).json(course);
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
    const course = await prisma.course.update({ where: { id: req.params.id }, data: parsed.data });
    res.json(course);
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
