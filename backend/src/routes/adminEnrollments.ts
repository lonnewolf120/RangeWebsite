import { Router } from 'express';
import { z } from 'zod';
import { Prisma } from '@rangewebsite/database';
import { prisma } from '../db.js';

export const adminEnrollmentsRouter = Router();

adminEnrollmentsRouter.get('/', async (_req, res) => {
  const registrations = await prisma.courseRegistration.findMany({
    orderBy: { createdAt: 'desc' },
    include: { course: { select: { title: true, slug: true } } },
  });
  res.json(registrations);
});

const statusSchema = z.object({
  status: z.enum(['NEW', 'CONTACTED', 'CONFIRMED', 'REJECTED']),
});

adminEnrollmentsRouter.patch('/:id', async (req, res) => {
  const parsed = statusSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid status' });
    return;
  }

  try {
    const registration = await prisma.courseRegistration.update({
      where: { id: req.params.id },
      data: { status: parsed.data.status },
    });
    res.json(registration);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      res.status(404).json({ error: 'Registration not found' });
      return;
    }
    throw error;
  }
});
