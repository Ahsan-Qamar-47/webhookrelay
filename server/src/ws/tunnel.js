export default function setupTunnel(wss) {
  wss.on('connection', (ws, req) => {
    console.log('New CLI client connected');

    ws.on('message', (message) => {
      console.log(`Received: ${message}`);
    });

    ws.on('close', () => {
      console.log('CLI client disconnected');
    });
  });
}
