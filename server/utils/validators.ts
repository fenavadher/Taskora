import mongoose from 'mongoose';
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  type TaskPriority,
  type TaskStatus,
} from '../models/Task.ts';

export const isNonEmptyString = (val: unknown): val is string =>
  typeof val === 'string' && val.trim().length > 0;

export const isOptionalString = (val: unknown): val is string | undefined =>
  val === undefined || typeof val === 'string';

export const isValidEmail = (email: unknown): email is string => {
  if (typeof email !== 'string') return false;
  const trimmed = email.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) && trimmed.length <= 254;
};

export const isValidObjectId = (id: unknown): id is string =>
  typeof id === 'string' && mongoose.Types.ObjectId.isValid(id);

export const isValidPriority = (val: unknown): val is TaskPriority =>
  typeof val === 'string' && (TASK_PRIORITIES as readonly string[]).includes(val);

export const isValidStatus = (val: unknown): val is TaskStatus =>
  typeof val === 'string' && (TASK_STATUSES as readonly string[]).includes(val);

export const parseOptionalDate = (
  val: unknown
): { valid: true; date: Date | null } | { valid: false } => {
  if (val === undefined || val === null || val === '') {
    return { valid: true, date: null };
  }
  if (typeof val !== 'string' && !(val instanceof Date)) {
    return { valid: false };
  }
  const parsed = new Date(val);
  if (Number.isNaN(parsed.getTime())) {
    return { valid: false };
  }
  return { valid: true, date: parsed };
};

export const escapeRegex = (input: string): string =>
  input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
