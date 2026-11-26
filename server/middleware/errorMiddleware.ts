import type { NextFunction, Request, Response } from 'express';

export interface HttpError extends Error {
  statusCode?: number;
  code?: number | string;
}

export const notFound = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

export const errorHandler = (
  err: HttpError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = err.statusCode && err.statusCode >= 400 ? err.statusCode : 500;
  let message = err.message || 'Internal server error';

  if (err.name === 'ValidationError') {
    statusCode = 400;
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid resource identifier';
  } else if (err.code === 11000) {
    statusCode = 409;
    message = 'An account with this email already exists';
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Invalid or expired authentication token';
  }

  if (statusCode === 500) {
    console.error('[Server Error]', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
};
