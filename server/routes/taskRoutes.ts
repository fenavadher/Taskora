import { Router } from 'express';
import {
  createTask,
  deleteTask,
  getTaskById,
  getTaskStats,
  getTasks,
  updateTask,
} from '../controllers/taskController.ts';
import { protect } from '../middleware/authMiddleware.ts';
import { requireDb } from '../middleware/dbMiddleware.ts';

const router = Router();

router.use(requireDb, protect);

router.get('/stats', getTaskStats);
router.route('/').get(getTasks).post(createTask);
router.route('/:id').get(getTaskById).put(updateTask).patch(updateTask).delete(deleteTask);

export default router;
