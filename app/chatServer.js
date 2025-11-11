// Minimal WebSocket echo/broadcast server using the "ws" library.
// - Install deps: npm install ws
// - Run locally:  node app/chatServer.js
// - The Next.js UI connects to ws://localhost:8080

const WebSocket = require('ws');
const server = new WebSocket.Server({ port: 8080 });

console.log('WebSocket server started on ws://localhost:8080');

server.on('connection', (ws) => {
  console.log('New client connected');
  
  // Send welcome payload so clients can confirm connectivity
  ws.send(JSON.stringify({
    type: 'welcome',
    message: 'Connected to WebSocket server!',
    timestamp: new Date().toISOString()
  }));
  
  // Handle incoming messages
  ws.on('message', (data) => {
    console.log('Received:', data.toString());
    
    try {
      const message = JSON.parse(data);
      
      // Echo the message back to the sender with a server timestamp
      ws.send(JSON.stringify({
        type: 'echo',
        original: message,
        serverTime: new Date().toISOString()
      }));
      
      // Broadcast to all other connected clients
      server.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'broadcast',
            message: message,
            timestamp: new Date().toISOString()
          }));
        }
      });
    } catch (e) {
      console.error('Error parsing message:', e);
    }
  });
  
  // Handle client disconnect
  ws.on('close', () => {
    console.log('Client disconnected');
  });
  
  // Handle errors
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Periodic heartbeat helps demonstrate server activity and client count
setInterval(() => {
  server.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'heartbeat',
        timestamp: new Date().toISOString(),
        clientCount: server.clients.size
      }));
    }
  });
}, 10000); // Every 10 seconds