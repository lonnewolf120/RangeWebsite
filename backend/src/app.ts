import express, { type Express } from 'express';
import cors from 'cors';
import { coursesRouter } from './routes/courses.js';

export function createApp(): Express {
  const app = express();

  app.use(cors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000' }));
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/courses', coursesRouter);

  return app;
}
