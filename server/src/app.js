import express from 'express';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';

import { requestId } from './middleware/requestId.js';
import { configureCors } from './middleware/corsConfig.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { errorHandler } from './middleware/errorHandler.js';
import { swaggerSpec } from './config/swagger.js';
import { authenticate } from './middleware/auth.js';
import { getMe } from './controllers/authController.js';

import healthRoutes from './routes/health.js';
import ingestRoutes from './routes/ingest.js';
import authRoutes from './routes/auth.js';

const app = express();

app.use(requestId);
app.use(configureCors());
app.use(cookieParser());
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}
app.use(express.json());

app.use('/health', healthRoutes);
app.use('/ingest', ingestRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/me', authenticate, getMe);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
