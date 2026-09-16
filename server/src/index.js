import dotenv from 'dotenv';
import { WebSocketServer } from 'ws';

import app from './app.js';
import setupTunnel from './ws/tunnel.js';

dotenv.config();

const HTTP_PORT = process.env.PORT || 8080;
const WS_PORT = process.env.WS_PORT || 8081;

app.listen(HTTP_PORT, () => {
  console.log(`HTTP Server running on port ${HTTP_PORT}`);
});

const wss = new WebSocketServer({ port: WS_PORT });
setupTunnel(wss);
console.log(`WebSocket Server running on port ${WS_PORT}`);
