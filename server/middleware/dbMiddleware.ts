import type { NextFunction, Request, Response } from 'express';
import { connectDB, getDbStatus, isDbConfigured, isDbConnected } from '../config/db.ts';

export const requireDb = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (isDbConnected()) {
    next();
    return;
  }

  if (isDbConfigured()) {
    const connected = await connectDB();
    if (connected) {
      next();
      return;
    }
  }

  const status = getDbStatus();
  res.status(503).json({
    success: false,
    code: 'DATABASE_NOT_CONNECTED',
    message: status.configured
      ? `MongoDB connection failed: ${status.error || 'Unable to reach MongoDB Atlas.'}`
      : 'MongoDB is not configured. Set MONGO_URI in your .env file (or Secrets) and restart the server.',
    dbStatus: status,
  });
};
