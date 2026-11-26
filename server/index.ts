import 'dotenv/config';
import { createApiApp } from './app.ts';
import { connectDB } from './config/db.ts';
import { errorHandler, notFound } from './middleware/errorMiddleware.ts';

const PORT = Number(process.env.PORT) || 5000;

async function startStandaloneServer() {
  await connectDB();

  const app = createApiApp({
    enableCors: true,
    mountApi404: false,
  });

  app.get('/', (_req, res) => {
    res.json({
      success: true,
      message: 'Taskora Backend API is running.',
      health: '/api/health',
    });
  });

  app.use(notFound);
  app.use(errorHandler);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Taskora Server] Listening on http://localhost:${PORT}`);
  });
}

startStandaloneServer().catch((err) => {
  console.error('[Taskora Server] Failed to start:', err);
  process.exit(1);
});
