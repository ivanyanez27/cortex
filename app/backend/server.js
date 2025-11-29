// WebSocket server with two agent personalities.
// - Install deps: npm install ws
// - Run locally:  node app/chatServer.js
// - The Next.js UI connects to ws://localhost:8080

const WebSocket = require('ws');
const server = new WebSocket.Server({ port: 8080 });

console.log('WebSocket server started on ws://localhost:8080');

// Agent personalities
const dummyResponses = [
  (userMsg) => `I understand you're asking about "${userMsg}". From my perspective, this is an interesting topic that requires careful consideration.`,
  (userMsg) => `That's a great question! Let me think about "${userMsg}"... I believe we should approach this systematically.`,
  (userMsg) => `Regarding "${userMsg}", I think there are multiple angles to consider. My view is that we need to balance different factors.`,
  (userMsg) => `Interesting point about "${userMsg}". I'd like to add that context matters a lot here, and we should be mindful of the implications.`,
];

const OllamaResponses = [
  (userMsg) => `Hmm, about "${userMsg}" - I am still work in progress and do not have any opinions yet.`,
];

async function getAgentResponse(agent, userMessage) {
  console.log(`Agent ${agent} processing message:`, userMessage);
  
  // Call model API for AI agent
  const res = await fetch("http://127.0.0.1:8000/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: userMessage })
  });
  const reply = await res.json();
  return reply.response;
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
        await simulateAgentTyping(ws, 'dummy', 500);
        const dummyMsg = await getAgentResponse('dummy', userMessage);
        await simulateAgentMessage(ws, 'dummy', dummyMsg, 1500);

        // Simulate Agent 2 responding after a short delay
        await simulateAgentTyping(ws, 'Ollama', 300);
        const OllamaMsg = await getAgentResponse('Ollama', userMessage);
        await simulateAgentMessage(ws, 'Ollama', OllamaMsg, 1500);
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