import cors from 'cors';
import express, { type Express } from 'express';
import { getDbStatus } from './config/db.ts';
import { errorHandler, notFound } from './middleware/errorMiddleware.ts';
import authRoutes from './routes/authRoutes.ts';
import exportRoutes from './routes/exportRoutes.ts';
import taskRoutes from './routes/taskRoutes.ts';

export interface CreateAppOptions {
  enableCors?: boolean;
  mountApi404?: boolean;
}

export const createApiApp = (options: CreateAppOptions = {}): Express => {
  const app = express();

  app.set('trust proxy', 1);

  if (options.enableCors) {
    const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);

    app.use(
      cors({
        origin: (origin, callback) => {
          if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            callback(new Error('Origin not allowed by CORS'));
          }
        },
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
      })
    );
  }

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.get('/api/health', (_req, res) => {
    const dbStatus = getDbStatus();
    res.status(200).json({
      success: true,
      service: 'Taskora API',
      database: dbStatus,
      timestamp: new Date().toISOString(),
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/tasks', taskRoutes);
  app.use('/api/export-zip', exportRoutes);

  if (options.mountApi404) {
    app.use('/api', notFound);
  }

  app.use(errorHandler);

  return app;
};
