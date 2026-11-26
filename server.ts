import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createApiApp } from './server/app.ts';
import { connectDB } from './server/config/db.ts';
import { errorHandler, notFound } from './server/middleware/errorMiddleware.ts';

const PORT = 3000;

async function startServer() {
  await connectDB();

  const app = createApiApp({
    enableCors: false,
    mountApi404: true,
  });

  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) {
        next();
        return;
      }
      const indexFile = path.join(distPath, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build output not found. Run npm run build first.');
      }
    });
  }

  app.use('/api', notFound);
  app.use(errorHandler);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Taskora] Server running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Taskora] Failed to start server:', err);
  process.exit(1);
});
