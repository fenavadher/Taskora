import type { NextFunction, Request, Response } from 'express';
import { User, type IUserDocument } from '../models/User.ts';
import { verifyToken } from '../utils/jwt.ts';
import { isValidObjectId } from '../utils/validators.ts';

export interface AuthenticatedRequest extends Request {
  user?: IUserDocument;
}

export const protect = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Authentication required. Please sign in.',
      });
      return;
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Authentication token is missing.',
      });
      return;
    }

    const decoded = verifyToken(token);
    if (!isValidObjectId(decoded.id)) {
      res.status(401).json({
        success: false,
        message: 'Invalid authentication token.',
      });
      return;
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Account no longer exists. Please sign in again.',
      });
      return;
    }

    req.user = user;
    next();
  } catch {
    res.status(401).json({
      success: false,
      message: 'Session expired or invalid. Please sign in again.',
    });
  }
};
