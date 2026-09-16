import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { WebSocketServer } from 'ws';

import healthRoutes from './routes/health.js';
import ingestRoutes from './routes/ingest.js';
import setupTunnel from './ws/tunnel.js';

dotenv.config();

const app = express();
const HTTP_PORT = process.env.PORT || 8080;
const WS_PORT = process.env.WS_PORT || 8081;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.use('/health', healthRoutes);
app.use('/ingest', ingestRoutes);

app.listen(HTTP_PORT, () => {
  console.log(`HTTP Server running on port ${HTTP_PORT}`);
});

const wss = new WebSocketServer({ port: WS_PORT });
setupTunnel(wss);
console.log(`WebSocket Server running on port ${WS_PORT}`);
