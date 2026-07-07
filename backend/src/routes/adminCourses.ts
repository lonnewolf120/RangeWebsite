import { Router } from 'express';
import { z } from 'zod';
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

  const course = await prisma.course.create({ data: parsed.data });
  res.status(201).json(course);
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
  } catch {
    res.status(404).json({ error: 'Course not found' });
  }
});

adminCoursesRouter.delete('/:id', async (req, res) => {
  try {
    await prisma.course.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch {
    res.status(404).json({ error: 'Course not found' });
  }
});
