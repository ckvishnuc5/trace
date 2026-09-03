import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { apiRouter } from './src/server/routes/api.js';
import { traceService } from './src/server/services/TraceService.js';

async function startServer() {
  const app = express();
  app.set('trust proxy', 1); // Trust first proxy (required for secure cookies behind reverse proxy)
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  }));

  // Start the background trace renewal worker
  traceService.startWorker();

  // API Routes
  app.use('/api', apiRouter);

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Express v5 syntax per guidelines
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
