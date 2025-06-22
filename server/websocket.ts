import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import jwt from "jsonwebtoken";
import { storage } from "./storage";

const JWT_SECRET = process.env.JWT_SECRET || "Imissmaysamakmak";

// WebSocket connection management
const wsConnections = new Map<number, WebSocket[]>(); // userId -> WebSocket connections

function addConnection(userId: number, ws: WebSocket) {
  if (!wsConnections.has(userId)) {
    wsConnections.set(userId, []);
  }
  wsConnections.get(userId)!.push(ws);
}

function removeConnection(userId: number, ws: WebSocket) {
  const connections = wsConnections.get(userId);
  if (connections) {
    const index = connections.indexOf(ws);
    if (index > -1) {
      connections.splice(index, 1);
    }
    if (connections.length === 0) {
      wsConnections.delete(userId);
    }
  }
}

export async function broadcastToMatch(matchId: number, message: any, excludeUserId?: number) {
  try {
    // Get matches for all users to find the match participants
    const allMatches = await storage.getMatches(excludeUserId || 0);
    const match = allMatches.find(m => m.id === matchId);
    
    if (match) {
      [match.userId1, match.userId2].forEach(uid => {
        if (uid !== excludeUserId) {
          const connections = wsConnections.get(uid);
          if (connections) {
            connections.forEach(ws => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(message));
              }
            });
          }
        }
      });
    }
  } catch (error: any) {
    console.error('Error broadcasting to match:', error);
  }
}

export function setupWebSocket(httpServer: Server): WebSocketServer {
  console.log('Setting up WebSocket server...');
  
  // Setup WebSocket server with better configuration
  const wss = new WebSocketServer({ 
    server: httpServer,
    perMessageDeflate: false,
    maxPayload: 16 * 1024 * 1024, // 16MB
    clientTracking: true,
    handleProtocols: (protocols: Set<string>, request: any) => {
      // Handle protocol negotiation if needed
      return protocols.size > 0 ? Array.from(protocols)[0] : false;
    },
    // Enable secure WebSocket in production
    path: '/ws',
    verifyClient: (info: any, callback: any) => {
      // Allow all connections in development
      if (process.env.NODE_ENV !== 'production') {
        callback(true);
        return;
      }
      
      // In production, verify origin
      const origin = info.origin || info.req.headers.origin;
      const allowedOrigins = [
        process.env.CLIENT_URL || 'https://your-app-name.onrender.com',
        'http://localhost:5173'
      ];
      
      if (allowedOrigins.includes(origin)) {
        callback(true);
      } else {
        callback(false, 403, 'Forbidden');
      }
    }
  });

  // Handle server-level errors
  wss.on('error', (error: Error) => {
    console.error('WebSocket server error:', error);
  });

  wss.on('connection', (ws: WebSocket, req) => {
    console.log('New WebSocket connection from:', req.socket.remoteAddress);
    let userId: number | null = null;
    let pingInterval: NodeJS.Timeout | null = null;

    // Set up proper WebSocket error handling
    ws.on('error', (error: Error) => {
      console.error('WebSocket connection error:', error);
      if (userId) {
        removeConnection(userId, ws);
      }
      if (pingInterval) {
        clearInterval(pingInterval);
      }
      try {
        ws.terminate();
      } catch (e) {
        // Ignore termination errors
      }
    });

    // Handle unexpected close
    ws.on('close', (code: number, reason: Buffer) => {
      console.log(`WebSocket closed: ${code} ${reason.toString()}`);
      if (userId) {
        removeConnection(userId, ws);
      }
      if (pingInterval) {
        clearInterval(pingInterval);
      }
    });

    // Handle pong responses
    ws.on('pong', () => {
      // Connection is alive
    });

    // Send ping every 30 seconds to keep connection alive
    pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.ping();
        } catch (error) {
          console.error('Error sending ping:', error);
          if (pingInterval) {
            clearInterval(pingInterval);
          }
        }
      } else {
        if (pingInterval) {
          clearInterval(pingInterval);
        }
      }
    }, 30000);

    ws.on('message', async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        console.log('WebSocket message received:', message.type);
        
        if (message.type === 'auth') {
          // Authenticate WebSocket connection
          const token = message.token;
          if (token) {
            jwt.verify(token, JWT_SECRET, async (err: any, decoded: any) => {
              if (!err && decoded) {
                try {
                  const user = await storage.getUser(decoded.userId);
                  if (user) {
                    userId = user.id;
                    addConnection(userId, ws);
                    console.log(`WebSocket authenticated for user ${userId}`);
                    ws.send(JSON.stringify({ type: 'auth_success', userId }));
                  } else {
                    console.log('WebSocket auth failed: user not found');
                    ws.send(JSON.stringify({ type: 'auth_error', message: 'User not found' }));
                  }
                } catch (dbError) {
                  console.error('Database error during WebSocket auth:', dbError);
                  ws.send(JSON.stringify({ type: 'auth_error', message: 'Database error' }));
                }
              } else {
                console.log('WebSocket auth failed: invalid token', err?.message);
                ws.send(JSON.stringify({ type: 'auth_error', message: 'Invalid token' }));
              }
            });
          } else {
            console.log('WebSocket auth failed: no token provided');
            ws.send(JSON.stringify({ type: 'auth_error', message: 'No token provided' }));
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        try {
          ws.send(JSON.stringify({ type: 'error', message: 'Message processing error' }));
        } catch (sendError) {
          console.error('Error sending error message:', sendError);
        }
      }
    });
  });

  console.log('WebSocket server ready');
  return wss;
}
