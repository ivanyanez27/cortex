// WebSocket server with two agent personalities.
// - Install deps: npm install ws
// - Run locally:  node app/chatServer.js
// - The Next.js UI connects to ws://localhost:8080

const WebSocket = require('ws');
const server = new WebSocket.Server({ port: 8080 });

console.log('WebSocket server started on ws://localhost:8080');

// Agent personalities
const agent1Responses = [
  (userMsg) => `I understand you're asking about "${userMsg}". From my perspective, this is an interesting topic that requires careful consideration.`,
  (userMsg) => `That's a great question! Let me think about "${userMsg}"... I believe we should approach this systematically.`,
  (userMsg) => `Regarding "${userMsg}", I think there are multiple angles to consider. My view is that we need to balance different factors.`,
  (userMsg) => `Interesting point about "${userMsg}". I'd like to add that context matters a lot here, and we should be mindful of the implications.`,
];

const agent2Responses = [
  (userMsg) => `Hmm, about "${userMsg}" - I see it differently. I think we should focus on the practical aspects first.`,
  (userMsg) => `You mentioned "${userMsg}". I agree, but I'd also emphasize the importance of looking at the bigger picture.`,
  (userMsg) => `That's fascinating! Regarding "${userMsg}", I have a slightly different take. Let me share my perspective.`,
  (userMsg) => `Good point on "${userMsg}". However, I think we should also consider alternative approaches that might be more effective.`,
];

function getAgentResponse(agent, userMessage) {
  const responses = agent === 'agent1' ? agent1Responses : agent2Responses;
  const randomResponse = responses[Math.floor(Math.random() * responses.length)];
  return randomResponse(userMessage);
}

function simulateAgentTyping(ws, agent, delay) {
  return new Promise((resolve) => {
    setTimeout(() => {
      ws.send(JSON.stringify({ type: 'typing', agent }));
      resolve();
    }, delay);
  });
}

function simulateAgentMessage(ws, agent, content, delay) {
  return new Promise((resolve) => {
    setTimeout(() => {
      ws.send(JSON.stringify({
        type: 'message',
        role: agent,
        content: content
      }));
      resolve();
    }, delay);
  });
}

server.on('connection', (ws) => {
  console.log('New client connected');
  
  // Send welcome payload so clients can confirm connectivity
  ws.send(JSON.stringify({
    type: 'welcome',
    message: 'Connected to WebSocket server!',
    timestamp: new Date().toISOString()
  }));
  
  // Handle incoming messages
  ws.on('message', async (data) => {
    console.log('Received:', data.toString());
    
    try {
      const message = JSON.parse(data);
      
      // Only process user messages
      if (message.type === 'message' && message.content) {
        const userMessage = message.content;
        
        // Simulate Agent 1 responding
        await simulateAgentTyping(ws, 'agent1', 500);
        await simulateAgentMessage(ws, 'agent1', getAgentResponse('agent1', userMessage), 1500);
        
        // Simulate Agent 2 responding after a short delay
        await simulateAgentTyping(ws, 'agent2', 300);
        await simulateAgentMessage(ws, 'agent2', getAgentResponse('agent2', userMessage), 1500);
      }
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