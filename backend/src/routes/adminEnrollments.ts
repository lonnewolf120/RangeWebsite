import { Router } from 'express';
import { z } from 'zod';
import { Prisma } from '@rangewebsite/database';
import { prisma } from '../db.js';

export const adminEnrollmentsRouter = Router();

adminEnrollmentsRouter.get('/', async (_req, res) => {
  const enrollments = await prisma.enrollment.findMany({
    orderBy: { createdAt: 'desc' },
    include: { course: { select: { name: true, slug: true } } },
  });
  res.json(enrollments);
});

const statusSchema = z.object({
  status: z.enum(['NEW', 'CONTACTED', 'ENROLLED', 'REJECTED']),
});

adminEnrollmentsRouter.patch('/:id', async (req, res) => {
  const parsed = statusSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid status' });
    return;
  }

  try {
    const enrollment = await prisma.enrollment.update({
      where: { id: req.params.id },
      data: { status: parsed.data.status },
    });
    res.json(enrollment);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      res.status(404).json({ error: 'Enrollment not found' });
      return;
    }
    throw error;
  }
});
