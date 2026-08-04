import { Router } from 'express';
import { prisma } from '../db.js';

export const coursesRouter = Router();

export const INSTRUCTORS_INCLUDE = {
  instructors: {
    orderBy: { displayOrder: 'asc' as const },
    include: { staff: true },
  },
};

export function serializeCourse<
  T extends { instructors: { staff: { name: string; title: string; credentials: string | null; photoUrl: string | null } }[] },
>(course: T) {
  const { instructors, ...rest } = course;
  return {
    ...rest,
    instructors: instructors.map(({ staff }) => ({
      name: staff.name,
      title: staff.title,
      credentials: staff.credentials,
      photoUrl: staff.photoUrl,
    })),
  };
}

coursesRouter.get('/', async (_req, res) => {
  const courses = await prisma.course.findMany({
    orderBy: { displayOrder: 'asc' },
    include: INSTRUCTORS_INCLUDE,
  });
  res.json(courses.map(serializeCourse));
});

coursesRouter.get('/:slug', async (req, res) => {
  const course = await prisma.course.findUnique({
    where: { slug: req.params.slug },
    include: INSTRUCTORS_INCLUDE,
  });

  if (!course) {
    res.status(404).json({ error: 'Course not found' });
    return;
  }

  res.json(serializeCourse(course));
});
