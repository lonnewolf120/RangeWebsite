import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../db.js';
import { signAdminToken } from '../auth.js';

export const adminAuthRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const DUMMY_HASH = '$2a$12$CwTycUXWue0Thq9StjUM0uJ8Bxq0FvGVGVsAT0/vObDkQ9V.WvVFC';

adminAuthRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid login data' });
    return;
  }

  const admin = await prisma.adminUser.findUnique({ where: { email: parsed.data.email } });
  const passwordMatches = await bcrypt.compare(parsed.data.password, admin?.passwordHash ?? DUMMY_HASH);

  if (!admin || !passwordMatches) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const token = signAdminToken({ sub: admin.id, email: admin.email });
  res.json({ token });
});
