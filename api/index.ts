import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { apiRouter } from '../src/server/routes/api';
import { traceService } from '../src/server/services/TraceService';

const app = express();
app.set('trust proxy', 1);

app.use(express.json());
app.use(cookieParser());
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// Note: Background workers are not ideal in Serverless Functions because 
// the function sleeps between requests, but we start it here so it can 
// attempt to run during the request lifecycle.
traceService.startWorker();

app.use('/api', apiRouter);

export default app;
