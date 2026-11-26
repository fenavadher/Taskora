import type { NextFunction, Request, Response } from 'express';
import { User } from '../models/User.ts';
import type { AuthenticatedRequest } from '../middleware/authMiddleware.ts';
import { signToken } from '../utils/jwt.ts';
import { isNonEmptyString, isValidEmail } from '../utils/validators.ts';

const formatUser = (user: {
  _id: unknown;
  name: string;
  email: string;
  createdAt: Date;
}) => ({
  id: String(user._id),
  name: user.name,
  email: user.email,
  createdAt: user.createdAt,
});

export const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, password } = req.body ?? {};

    if (!isNonEmptyString(name) || name.trim().length < 2) {
      res.status(400).json({
        success: false,
        message: 'Full name must be at least 2 characters.',
      });
      return;
    }

    if (name.trim().length > 80) {
      res.status(400).json({
        success: false,
        message: 'Full name cannot exceed 80 characters.',
      });
      return;
    }

    if (!isValidEmail(email)) {
      res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
      return;
    }

    if (typeof password !== 'string' || password.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters.',
      });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
      return;
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
    });

    const token = signToken(String(user._id));

    res.status(201).json({
      success: true,
      token,
      user: formatUser(user),
    });
  } catch (err) {
    next(err);
  }
};

export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body ?? {};

    if (!isValidEmail(email) || typeof password !== 'string' || password.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Please provide a valid email and password.',
      });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
      return;
    }

    const token = signToken(String(user._id));

    res.status(200).json({
      success: true,
      token,
      user: formatUser(user),
    });
  } catch (err) {
    next(err);
  }
};

export const getMe = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Not authorized.',
    });
    return;
  }

  res.status(200).json({
    success: true,
    user: formatUser(req.user),
  });
};

export const logoutUser = (_req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    message: 'Signed out successfully.',
  });
};
