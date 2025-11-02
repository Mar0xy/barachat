import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import { config } from '@barachat/config';
import { db } from '@barachat/database';
import { EventType } from '@barachat/models';

interface Client {
  ws: WebSocket;
  userId: string;
  sessionId: string;
}

const clients = new Map<string, Client>();

// Export broadcast functions for use by API
export function broadcast(event: any, excludeSessionId?: string) {
  const message = JSON.stringify(event);
  for (const [sessionId, client] of clients) {
    if (sessionId !== excludeSessionId && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
    }
  }
}

export function broadcastToUser(userId: string, event: any) {
  const message = JSON.stringify(event);
  for (const client of clients.values()) {
    if (client.userId === userId && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
    }
  }
}

export async function broadcastToChannel(channelId: string, event: any, excludeUserId?: string) {
  const message = JSON.stringify(event);
  
  // Get channel to find recipients
  const channel = await db.channels.findOne({ _id: channelId });
  if (!channel) return;
  
  // Determine who should receive this message
  let recipientIds: string[] = [];
  
  if (channel.channelType === 'DirectMessage') {
    // For DMs, send to all recipients
    recipientIds = channel.recipients || [];
  } else {
    // For server channels, find all members of the server
    const serverId = channel.server;
    if (serverId) {
      const members = await db.members.find({ '_id.server': serverId }).toArray();
      recipientIds = members.map(m => m._id.user);
    }
  }
  
  // Broadcast to all clients for users who should receive this
  for (const client of clients.values()) {
    if (
      recipientIds.includes(client.userId) &&
      (!excludeUserId || client.userId !== excludeUserId) &&
      client.ws.readyState === WebSocket.OPEN
    ) {
      client.ws.send(message);
    }
  }
}

async function handleConnection(ws: WebSocket) {
  let client: Client | null = null;

  ws.on('message', async (data: Buffer) => {
    try {
      const message = JSON.parse(data.toString());

      if (message.type === 'Authenticate') {
        const { token } = message;
        
        try {
          const decoded = jwt.verify(token, config.jwtSecret) as { userId: string };
          const sessionId = Math.random().toString(36).substring(7);
          
          client = {
            ws,
            userId: decoded.userId,
            sessionId
          };
          
          clients.set(sessionId, client);
          
          // Store session in Redis
          await db.setSession(decoded.userId, sessionId);
          await db.setPresence(decoded.userId, true);

          // Send authenticated event
          ws.send(JSON.stringify({
            type: EventType.Authenticated
          }));

          // Fetch user data
          const user = await db.users.findOne({ _id: decoded.userId });
          const channels = await db.channels.find({
            $or: [
              { recipients: decoded.userId },
              { _id: { $in: await getServerChannels(decoded.userId) } }
            ]
          }).toArray();

          const servers = await db.servers.find({
            _id: { $in: await getUserServers(decoded.userId) }
          }).toArray();

          const members = await db.members.find({
            '_id.user': decoded.userId
          }).toArray();

          // Send ready event
          ws.send(JSON.stringify({
            type: EventType.Ready,
            users: [user],
            servers,
            channels,
            members
          }));

          // Broadcast presence
          broadcast({
            type: EventType.UserPresence,
            id: decoded.userId,
            online: true
          }, sessionId);

        } catch (error) {
          ws.send(JSON.stringify({ type: 'Error', error: 'Invalid token' }));
          ws.close();
        }
      } else if (message.type === 'Ping') {
        ws.send(JSON.stringify({ type: EventType.Pong }));
      } else if (message.type === 'BeginTyping' || message.type === 'Typing') {
        if (client) {
          const user = await db.users.findOne({ _id: client.userId });
          broadcast({
            type: 'Typing',
            channel: message.channel,
            username: user?.displayName || user?.username
          }, client.sessionId);
        }
      } else if (message.type === 'EndTyping' || message.type === 'StopTyping') {
        if (client) {
          const user = await db.users.findOne({ _id: client.userId });
          broadcast({
            type: 'StopTyping',
            channel: message.channel,
            username: user?.displayName || user?.username
          }, client.sessionId);
        }
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  });

  ws.on('close', async () => {
    if (client) {
      clients.delete(client.sessionId);
      await db.removeSession(client.userId, client.sessionId);
      
      // Check if user has other sessions
      const sessions = await db.getSessions(client.userId);
      if (sessions.length === 0) {
        await db.setPresence(client.userId, false);
        
        // Broadcast offline status
        broadcast({
          type: EventType.UserPresence,
          id: client.userId,
          online: false
        });
      }
    }
  });
}

async function getUserServers(userId: string): Promise<string[]> {
  const members = await db.members.find({ '_id.user': userId }).toArray();
  return members.map(m => m._id.server);
}

async function getServerChannels(userId: string): Promise<string[]> {
  const serverIds = await getUserServers(userId);
  const servers = await db.servers.find({ _id: { $in: serverIds } }).toArray();
  return servers.flatMap(s => s.channels);
}

async function start() {
  try {
    await db.connect();

    const wss = new WebSocketServer({ 
      port: config.server.wsPort,
      host: config.server.host
    });

    wss.on('connection', handleConnection);

    // Subscribe to Redis events and broadcast to connected clients
    await db.subscribeToEvents(async (event: any) => {
      try {
        // Handle different event types
        if (event.type === EventType.Message && event.channelId) {
          // Broadcast message to channel recipients
          await broadcastToChannel(event.channelId, {
            type: event.type,
            message: event.message
          }, event.excludeUserId);
        } else if (event.type === EventType.MessageDelete && event.channelId) {
          // Broadcast message deletion to channel recipients
          await broadcastToChannel(event.channelId, {
            type: event.type,
            id: event.id,
            channel: event.channel
          });
        } else if (event.type === EventType.UserUpdate && event.id) {
          // Broadcast user update to all connected clients
          broadcast({
            type: event.type,
            id: event.id,
            data: event.data
          });
        } else {
          // For other event types, broadcast as-is
          broadcast(event);
        }
      } catch (error) {
        console.error('Error handling Redis event:', error);
      }
    });

    console.log(`WebSocket server running on ws://${config.server.host}:${config.server.wsPort}`);
  } catch (error) {
    console.error('Failed to start WebSocket server:', error);
    process.exit(1);
  }
}

// Only start if this is the main module
if (require.main === module) {
  start();
}
