import type { NextFunction, Response } from 'express';
import { Task, type ITaskDocument } from '../models/Task.ts';
import type { AuthenticatedRequest } from '../middleware/authMiddleware.ts';
import {
  escapeRegex,
  isNonEmptyString,
  isOptionalString,
  isValidObjectId,
  isValidPriority,
  isValidStatus,
  parseOptionalDate,
} from '../utils/validators.ts';

const serializeTask = (task: ITaskDocument) => ({
  id: String(task._id),
  user: String(task.user),
  title: task.title,
  description: task.description,
  priority: task.priority,
  status: task.status,
  category: task.category,
  dueDate: task.dueDate ? task.dueDate.toISOString() : null,
  completedAt: task.completedAt ? task.completedAt.toISOString() : null,
  createdAt: task.createdAt.toISOString(),
  updatedAt: task.updatedAt.toISOString(),
});

const getDayBounds = (offsetMinutes = 0) => {
  const now = new Date();
  const shifted = new Date(now.getTime() - offsetMinutes * 60_000);
  const startUtc = Date.UTC(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth(),
    shifted.getUTCDate(),
    0,
    0,
    0,
    0
  );
  const start = new Date(startUtc + offsetMinutes * 60_000);
  const end = new Date(start.getTime() + 24 * 60 * 60_000 - 1);
  return { start, end, now };
};

export const getTasks = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { search, status, priority, category, view, sort, tzOffset } = req.query;

    const filter: Record<string, unknown> = { user: userId };

    if (typeof status === 'string' && status !== 'All' && isValidStatus(status)) {
      filter.status = status;
    }

    if (typeof priority === 'string' && priority !== 'All' && isValidPriority(priority)) {
      filter.priority = priority;
    }

    if (typeof category === 'string' && category.trim() && category !== 'All') {
      filter.category = category.trim();
    }

    if (typeof search === 'string' && search.trim().length > 0) {
      const safePattern = new RegExp(escapeRegex(search.trim()), 'i');
      filter.$or = [
        { title: safePattern },
        { description: safePattern },
        { category: safePattern },
      ];
    }

    if (view === 'today') {
      const offset = typeof tzOffset === 'string' ? Number.parseInt(tzOffset, 10) : 0;
      const safeOffset = Number.isFinite(offset) ? offset : 0;
      const { start, end } = getDayBounds(safeOffset);
      filter.dueDate = { $gte: start, $lte: end };
    } else if (view === 'completed') {
      filter.status = 'Completed';
    }

    let sortSpec: Record<string, 1 | -1> = { createdAt: -1 };
    if (sort === 'dueDate_asc') {
      sortSpec = { dueDate: 1, createdAt: -1 };
    } else if (sort === 'dueDate_desc') {
      sortSpec = { dueDate: -1, createdAt: -1 };
    } else if (sort === 'oldest') {
      sortSpec = { createdAt: 1 };
    }

    const tasks = await Task.find(filter).sort(sortSpec);

    if (sort === 'priority') {
      const rank: Record<string, number> = { High: 0, Medium: 1, Low: 2 };
      tasks.sort((a, b) => (rank[a.priority] ?? 3) - (rank[b.priority] ?? 3));
    } else if (sort === 'dueDate_asc') {
      // Keep tasks without a dueDate at the bottom when sorting by earliest due date
      tasks.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.getTime() - b.dueDate.getTime();
      });
    }

    res.status(200).json({
      success: true,
      count: tasks.length,
      tasks: tasks.map(serializeTask),
    });
  } catch (err) {
    next(err);
  }
};

export const getTaskStats = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!._id;
    const tzParam = typeof req.query.tzOffset === 'string' ? Number.parseInt(req.query.tzOffset, 10) : 0;
    const safeOffset = Number.isFinite(tzParam) ? tzParam : 0;
    const { start: todayStart, end: todayEnd, now } = getDayBounds(safeOffset);
    const soonEnd = new Date(now.getTime() + 48 * 60 * 60_000);

    const allTasks = await Task.find({ user: userId }).sort({ dueDate: 1, createdAt: -1 });

    let pending = 0;
    let inProgress = 0;
    let completed = 0;
    let overdue = 0;
    let dueToday = 0;
    let dueSoon = 0;
    let completedToday = 0;

    const categorySet = new Set<string>();
    const alerts: ITaskDocument[] = [];

    for (const task of allTasks) {
      if (task.category) {
        categorySet.add(task.category);
      }

      if (task.status === 'Pending') pending += 1;
      else if (task.status === 'In Progress') inProgress += 1;
      else if (task.status === 'Completed') completed += 1;

      if (
        task.status === 'Completed' &&
        task.completedAt &&
        task.completedAt >= todayStart &&
        task.completedAt <= todayEnd
      ) {
        completedToday += 1;
      }

      if (task.status !== 'Completed' && task.dueDate) {
        if (task.dueDate < todayStart) {
          overdue += 1;
          alerts.push(task);
        } else if (task.dueDate >= todayStart && task.dueDate <= todayEnd) {
          dueToday += 1;
          alerts.push(task);
        } else if (task.dueDate > todayEnd && task.dueDate <= soonEnd) {
          dueSoon += 1;
          alerts.push(task);
        }
      }
    }

    // Build 7-day progress array ending today
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dailyProgress = [];
    for (let i = 6; i >= 0; i -= 1) {
      const dayStart = new Date(todayStart.getTime() - i * 24 * 60 * 60_000);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60_000 - 1);
      const shiftedDay = new Date(dayStart.getTime() - safeOffset * 60_000);
      const label = i === 0 ? 'Today' : dayNames[shiftedDay.getUTCDay()];
      const dateStr = shiftedDay.toISOString().slice(0, 10);

      let dayCompleted = 0;
      let dayCreated = 0;
      for (const task of allTasks) {
        if (task.completedAt && task.completedAt >= dayStart && task.completedAt <= dayEnd) {
          dayCompleted += 1;
        }
        if (task.createdAt >= dayStart && task.createdAt <= dayEnd) {
          dayCreated += 1;
        }
      }

      dailyProgress.push({
        date: dateStr,
        label,
        completed: dayCompleted,
        created: dayCreated,
      });
    }

    res.status(200).json({
      success: true,
      stats: {
        total: allTasks.length,
        pending,
        inProgress,
        completed,
        overdue,
        dueToday,
        dueSoon,
        completedToday,
        completionRate:
          allTasks.length > 0 ? Math.round((completed / allTasks.length) * 100) : 0,
      },
      dailyProgress,
      alerts: alerts.slice(0, 10).map(serializeTask),
      categories: Array.from(categorySet).sort(),
    });
  } catch (err) {
    next(err);
  }
};

export const getTaskById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      res.status(400).json({ success: false, message: 'Invalid task ID.' });
      return;
    }

    const task = await Task.findOne({ _id: id, user: req.user!._id });
    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      task: serializeTask(task),
    });
  } catch (err) {
    next(err);
  }
};

export const createTask = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { title, description, priority, status, category, dueDate } = req.body ?? {};

    if (!isNonEmptyString(title)) {
      res.status(400).json({ success: false, message: 'Task title is required.' });
      return;
    }

    if (title.trim().length > 160) {
      res.status(400).json({
        success: false,
        message: 'Task title cannot exceed 160 characters.',
      });
      return;
    }

    if (!isOptionalString(description)) {
      res.status(400).json({ success: false, message: 'Invalid description format.' });
      return;
    }

    if (priority !== undefined && !isValidPriority(priority)) {
      res.status(400).json({
        success: false,
        message: 'Priority must be Low, Medium, or High.',
      });
      return;
    }

    if (status !== undefined && !isValidStatus(status)) {
      res.status(400).json({
        success: false,
        message: 'Status must be Pending, In Progress, or Completed.',
      });
      return;
    }

    if (!isOptionalString(category)) {
      res.status(400).json({ success: false, message: 'Invalid category format.' });
      return;
    }

    const parsedDate = parseOptionalDate(dueDate);
    if (!parsedDate.valid) {
      res.status(400).json({ success: false, message: 'Invalid due date.' });
      return;
    }

    const resolvedStatus = status ?? 'Pending';
    const task = await Task.create({
      user: req.user!._id,
      title: title.trim(),
      description: description ? description.trim() : '',
      priority: priority ?? 'Medium',
      status: resolvedStatus,
      category: category && category.trim() ? category.trim() : 'General',
      dueDate: parsedDate.date,
      completedAt: resolvedStatus === 'Completed' ? new Date() : null,
    });

    res.status(201).json({
      success: true,
      task: serializeTask(task),
    });
  } catch (err) {
    next(err);
  }
};

export const updateTask = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      res.status(400).json({ success: false, message: 'Invalid task ID.' });
      return;
    }

    const task = await Task.findOne({ _id: id, user: req.user!._id });
    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found.' });
      return;
    }

    const { title, description, priority, status, category, dueDate } = req.body ?? {};

    if (title !== undefined) {
      if (!isNonEmptyString(title)) {
        res.status(400).json({ success: false, message: 'Task title cannot be empty.' });
        return;
      }
      if (title.trim().length > 160) {
        res.status(400).json({
          success: false,
          message: 'Task title cannot exceed 160 characters.',
        });
        return;
      }
      task.title = title.trim();
    }

    if (description !== undefined) {
      if (typeof description !== 'string') {
        res.status(400).json({ success: false, message: 'Invalid description format.' });
        return;
      }
      task.description = description.trim();
    }

    if (priority !== undefined) {
      if (!isValidPriority(priority)) {
        res.status(400).json({
          success: false,
          message: 'Priority must be Low, Medium, or High.',
        });
        return;
      }
      task.priority = priority;
    }

    if (status !== undefined) {
      if (!isValidStatus(status)) {
        res.status(400).json({
          success: false,
          message: 'Status must be Pending, In Progress, or Completed.',
        });
        return;
      }
      if (status === 'Completed' && task.status !== 'Completed') {
        task.completedAt = new Date();
      } else if (status !== 'Completed') {
        task.completedAt = null;
      }
      task.status = status;
    }

    if (category !== undefined) {
      if (typeof category !== 'string') {
        res.status(400).json({ success: false, message: 'Invalid category format.' });
        return;
      }
      task.category = category.trim() || 'General';
    }

    if (dueDate !== undefined) {
      const parsedDate = parseOptionalDate(dueDate);
      if (!parsedDate.valid) {
        res.status(400).json({ success: false, message: 'Invalid due date.' });
        return;
      }
      task.dueDate = parsedDate.date;
    }

    await task.save();

    res.status(200).json({
      success: true,
      task: serializeTask(task),
    });
  } catch (err) {
    next(err);
  }
};

export const deleteTask = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      res.status(400).json({ success: false, message: 'Invalid task ID.' });
      return;
    }

    const deleted = await Task.findOneAndDelete({ _id: id, user: req.user!._id });
    if (!deleted) {
      res.status(404).json({ success: false, message: 'Task not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully.',
      id: String(deleted._id),
    });
  } catch (err) {
    next(err);
  }
};
