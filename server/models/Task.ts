import mongoose, { type Document, type Model } from 'mongoose';

export type TaskPriority = 'Low' | 'Medium' | 'High';
export type TaskStatus = 'Pending' | 'In Progress' | 'Completed';

export const TASK_PRIORITIES: readonly TaskPriority[] = ['Low', 'Medium', 'High'];
export const TASK_STATUSES: readonly TaskStatus[] = ['Pending', 'In Progress', 'Completed'];

export interface ITask {
  user: mongoose.Types.ObjectId;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  category: string;
  dueDate: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITaskDocument extends ITask, Document {}

const taskSchema = new mongoose.Schema<ITaskDocument>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Task must belong to a user'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      minlength: [1, 'Task title cannot be empty'],
      maxlength: [160, 'Task title cannot exceed 160 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    priority: {
      type: String,
      enum: {
        values: ['Low', 'Medium', 'High'],
        message: 'Priority must be Low, Medium, or High',
      },
      default: 'Medium',
    },
    status: {
      type: String,
      enum: {
        values: ['Pending', 'In Progress', 'Completed'],
        message: 'Status must be Pending, In Progress, or Completed',
      },
      default: 'Pending',
    },
    category: {
      type: String,
      trim: true,
      default: 'General',
      maxlength: [40, 'Category cannot exceed 40 characters'],
    },
    dueDate: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

taskSchema.index({ user: 1, status: 1, dueDate: 1 });
taskSchema.index({ user: 1, createdAt: -1 });

export const Task: Model<ITaskDocument> =
  mongoose.models.Task || mongoose.model<ITaskDocument>('Task', taskSchema);
