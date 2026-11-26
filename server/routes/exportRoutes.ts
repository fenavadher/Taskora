import fs from 'fs';
import path from 'path';
import archiver, { type Archiver } from 'archiver';
import { Router, type Request, type Response } from 'express';

const router = Router();

const CLIENT_PACKAGE_JSON = {
  name: 'taskora-client',
  private: true,
  version: '1.0.0',
  type: 'module',
  scripts: {
    dev: 'vite',
    build: 'tsc -b && vite build',
    preview: 'vite preview',
  },
  dependencies: {
    axios: '^1.7.9',
    'lucide-react': '^0.546.0',
    motion: '^12.23.24',
    react: '^19.0.1',
    'react-dom': '^19.0.1',
    'react-router-dom': '^7.1.5',
  },
  devDependencies: {
    '@tailwindcss/vite': '^4.3.3',
    '@types/react': '^19.0.0',
    '@types/react-dom': '^19.0.0',
    '@vitejs/plugin-react': '^4.3.4',
    tailwindcss: '^4.3.3',
    typescript: '^5.7.2',
    vite: '^6.0.0',
  },
};

const CLIENT_VITE_CONFIG = `import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
`;

const CLIENT_TSCONFIG = {
  compilerOptions: {
    target: 'ES2022',
    useDefineForClassFields: true,
    lib: ['ES2022', 'DOM', 'DOM.Iterable'],
    module: 'ESNext',
    skipLibCheck: true,
    moduleResolution: 'bundler',
    allowImportingTsExtensions: true,
    isolatedModules: true,
    moduleDetection: 'force',
    types: ['vite/client'],
    noEmit: true,
    jsx: 'react-jsx',
    strict: true,
  },
  include: ['src'],
};

const CLIENT_ENV_EXAMPLE = `# Optional: Only needed in production when frontend and backend are hosted on different domains
# Example: VITE_API_URL=https://taskora-api.onrender.com/api
VITE_API_URL=
`;

const addDirectoryFiltered = (
  archive: Archiver,
  sourceDir: string,
  zipPrefix: string,
  ignoreNames: Set<string>
) => {
  if (!fs.existsSync(sourceDir)) return;
  const entries = fs.readdirSync(sourceDir, { withFileTypes: true });
  for (const entry of entries) {
    if (ignoreNames.has(entry.name)) continue;
    const fullPath = path.join(sourceDir, entry.name);
    const destPath = `${zipPrefix}/${entry.name}`;
    if (entry.isDirectory()) {
      addDirectoryFiltered(archive, fullPath, destPath, ignoreNames);
    } else if (entry.isFile()) {
      archive.file(fullPath, { name: destPath });
    }
  }
};

router.get('/', (req: Request, res: Response) => {
  const rootDir = process.cwd();
  const ignore = new Set(['node_modules', 'dist', '.env', '.git', '.DS_Store']);

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', 'attachment; filename="taskora-mern-project.zip"');

 const archive = archiver('zip', { zlib: { level: 9 } });

  archive.on('error', (err: Error) => {
    console.error('[Export ZIP Error]', err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Failed to generate project ZIP.' });
    }
  });

  archive.pipe(res);

  // Server folder (complete standalone Express + Mongoose backend, excluding node_modules)
  addDirectoryFiltered(archive, path.join(rootDir, 'server'), 'taskora/server', ignore);

  // Client folder (complete standalone React + Vite frontend, excluding node_modules)
  addDirectoryFiltered(archive, path.join(rootDir, 'src'), 'taskora/client/src', ignore);
  const indexHtmlPath = path.join(rootDir, 'index.html');
  if (fs.existsSync(indexHtmlPath)) {
    archive.file(indexHtmlPath, { name: 'taskora/client/index.html' });
  }
  archive.append(JSON.stringify(CLIENT_PACKAGE_JSON, null, 2) + '\n', {
    name: 'taskora/client/package.json',
  });
  archive.append(CLIENT_VITE_CONFIG, { name: 'taskora/client/vite.config.ts' });
  archive.append(JSON.stringify(CLIENT_TSCONFIG, null, 2) + '\n', {
    name: 'taskora/client/tsconfig.json',
  });
  archive.append(CLIENT_ENV_EXAMPLE, { name: 'taskora/client/.env.example' });

  // Root docs & .env.example
  const readmePath = path.join(rootDir, 'README.md');
  if (fs.existsSync(readmePath)) {
    archive.file(readmePath, { name: 'taskora/README.md' });
  }
  const envExamplePath = path.join(rootDir, '.env.example');
  if (fs.existsSync(envExamplePath)) {
    archive.file(envExamplePath, { name: 'taskora/.env.example' });
  }
  const gitignorePath = path.join(rootDir, '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    archive.file(gitignorePath, { name: 'taskora/.gitignore' });
  }

  void archive.finalize();
});

export default router;
