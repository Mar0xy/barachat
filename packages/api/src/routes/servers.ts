import { Router, type Router as ExpressRouter } from 'express';
import { ulid } from 'ulid';
import { db } from '@barachat/database';
import { authenticate, AuthRequest } from '../middleware/auth';

export const serversRouter: ExpressRouter = Router();

// Create server
serversRouter.post('/create', authenticate, async (req: AuthRequest, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const serverId = ulid();
    const channelId = ulid();

    // Create default channel
    const channel = {
      _id: channelId,
      channelType: 'TextChannel',
      server: serverId,
      name: 'general',
      description: 'General discussion'
    };

    await db.channels.insertOne(channel as any);

    // Create server
    const server = {
      _id: serverId,
      owner: req.userId!,
      name,
      description,
      channels: [channelId],
      defaultPermissions: 0
    };

    await db.servers.insertOne(server as any);

    // Add creator as member
    const member = {
      _id: {
        server: serverId,
        user: req.userId!
      },
      roles: []
    };

    await db.members.insertOne(member as any);

    res.json(server);
  } catch (error) {
    console.error('Error creating server:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get server
serversRouter.get('/:serverId', authenticate, async (req: AuthRequest, res) => {
  try {
    const server = await db.servers.findOne({ _id: req.params.serverId });
    
    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    res.json(server);
  } catch (error) {
    console.error('Error fetching server:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
