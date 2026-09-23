import dotenv from 'dotenv';
import { WebSocketServer } from 'ws';

import app from './app.js';
import setupTunnel from './ws/tunnel.js';
import setupBrowserWS from './ws/browser.js';

dotenv.config();

const HTTP_PORT = process.env.PORT || 8080;
const WS_PORT = process.env.WS_PORT || 8081;
const BROWSER_WS_PORT = process.env.BROWSER_WS_PORT || 8082;

app.listen(HTTP_PORT, () => {
  console.log(`HTTP Server running on port ${HTTP_PORT}`);
});

const wss = new WebSocketServer({ port: WS_PORT });
setupTunnel(wss);
console.log(`Tunnel WebSocket Server running on port ${WS_PORT}`);

const browserWss = new WebSocketServer({ port: BROWSER_WS_PORT });
setupBrowserWS(browserWss);
console.log(`Browser UI WebSocket Server running on port ${BROWSER_WS_PORT}`);
