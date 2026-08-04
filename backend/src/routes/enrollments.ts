import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';

export const enrollmentsRouter = Router();

const createRegistrationSchema = z.object({
  courseId: z.string().uuid().optional(),
  name: z.string().min(1).max(200),
  email: z.string().email(),
  phone: z.string().max(30).optional(),
  organization: z.string().max(200).optional(),
  designation: z.string().max(200).optional(),
  preferredBatch: z.string().max(200).optional(),
  message: z.string().max(2000).optional(),
});

enrollmentsRouter.post('/', async (req, res) => {
  const parsed = createRegistrationSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid registration data', details: parsed.error.flatten() });
    return;
  }

  const registration = await prisma.courseRegistration.create({ data: parsed.data });
  res.status(201).json({ id: registration.id, status: registration.status });
});
