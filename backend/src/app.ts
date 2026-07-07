import express, { type Express } from 'express';
import cors from 'cors';
import { coursesRouter } from './routes/courses.js';
import { enrollmentsRouter } from './routes/enrollments.js';
import { adminAuthRouter } from './routes/adminAuth.js';
import { adminCoursesRouter } from './routes/adminCourses.js';
import { requireAdminAuth } from './auth.js';

export function createApp(): Express {
  const app = express();

  app.use(cors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000' }));
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/courses', coursesRouter);
  app.use('/api/enrollments', enrollmentsRouter);
  app.use('/api/admin', adminAuthRouter);
  app.use('/api/admin/courses', requireAdminAuth, adminCoursesRouter);

  return app;
}
