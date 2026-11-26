import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const IN_MEMORY_FALLBACK_SECRET = crypto.randomBytes(32).toString('hex');

export const getJwtSecret = (): string => {
  const configured = process.env.JWT_SECRET?.trim();
  return configured && configured.length >= 16 ? configured : IN_MEMORY_FALLBACK_SECRET;
};

export interface JwtPayload {
  id: string;
}

export const signToken = (userId: string): string => {
  return jwt.sign({ id: userId }, getJwtSecret(), {
    expiresIn: '7d',
  });
};

export const verifyToken = (token: string): JwtPayload => {
  const decoded = jwt.verify(token, getJwtSecret());
  if (typeof decoded !== 'object' || decoded === null || typeof (decoded as JwtPayload).id !== 'string') {
    throw new Error('Invalid token payload');
  }
  return { id: (decoded as JwtPayload).id };
};
