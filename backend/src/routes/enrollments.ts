import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';

export const enrollmentsRouter = Router();

const createEnrollmentSchema = z.object({
  courseId: z.string().uuid().optional(),
  name: z.string().min(1).max(200),
  email: z.string().email(),
  phone: z.string().max(30).optional(),
  message: z.string().max(2000).optional(),
});

enrollmentsRouter.post('/', async (req, res) => {
  const parsed = createEnrollmentSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid enrollment data', details: parsed.error.flatten() });
    return;
  }

  const enrollment = await prisma.enrollment.create({ data: parsed.data });
  res.status(201).json({ id: enrollment.id, status: enrollment.status });
});
