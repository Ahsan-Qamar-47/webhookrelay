import express from 'express';
import morgan from 'morgan';

import { requestId } from './middleware/requestId.js';
import { configureCors } from './middleware/corsConfig.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { errorHandler } from './middleware/errorHandler.js';

import healthRoutes from './routes/health.js';
import ingestRoutes from './routes/ingest.js';

const app = express();

app.use(requestId);
app.use(configureCors());
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}
app.use(express.json());

app.use('/health', healthRoutes);
app.use('/ingest', ingestRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
