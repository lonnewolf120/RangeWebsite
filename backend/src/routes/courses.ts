import { Router } from 'express';
import { prisma } from '../db.js';

export const coursesRouter = Router();

coursesRouter.get('/', async (_req, res) => {
  const courses = await prisma.course.findMany({
    orderBy: { displayOrder: 'asc' },
    select: {
      id: true,
      slug: true,
      name: true,
      shortDescription: true,
      durationLabel: true,
      featuredInHero: true,
      displayOrder: true,
    },
  });
  res.json(courses);
});

coursesRouter.get('/:slug', async (req, res) => {
  const course = await prisma.course.findUnique({
    where: { slug: req.params.slug },
  });

  if (!course) {
    res.status(404).json({ error: 'Course not found' });
    return;
  }

  res.json(course);
});
