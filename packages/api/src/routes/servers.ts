import { Router, type Router as ExpressRouter } from 'express';
import { ulid } from 'ulid';
import { db } from '@barachat/database';
import { authenticate, AuthRequest } from '../middleware/auth';

export const serversRouter: ExpressRouter = Router();

// List servers for current user
serversRouter.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    // Find all servers where user is a member
    const members = await db.members.find({
      '_id.user': req.userId
    }).toArray();
    
    const serverIds = members.map(m => m._id.server);
    const servers = await db.servers.find({
      _id: { $in: serverIds }
    }).toArray();

    res.json(servers);
  } catch (error) {
    console.error('Error fetching servers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

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

// Update server
serversRouter.patch('/:serverId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { serverId } = req.params;
    const { name, description, icon } = req.body;

    // Check if user is server owner
    const server = await db.servers.findOne({ _id: serverId });
    
    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    if (server.owner !== req.userId) {
      return res.status(403).json({ error: 'Forbidden: Only server owner can update server' });
    }

    const update: any = {};
    if (name !== undefined) update.name = name;
    if (description !== undefined) update.description = description;
    if (icon !== undefined) update.icon = icon;

    await db.servers.updateOne(
      { _id: serverId },
      { $set: update }
    );

    const updatedServer = await db.servers.findOne({ _id: serverId });
    res.json(updatedServer);
  } catch (error) {
    console.error('Error updating server:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create channel in server
serversRouter.post('/:serverId/channels', authenticate, async (req: AuthRequest, res) => {
  try {
    const { serverId } = req.params;
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Check if user is server member
    const server = await db.servers.findOne({ _id: serverId });
    
    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    const member = await db.members.findOne({
      '_id.server': serverId,
      '_id.user': req.userId
    });

    if (!member) {
      return res.status(403).json({ error: 'Forbidden: Not a server member' });
    }

    const channelId = ulid();

    const channel = {
      _id: channelId,
      channelType: 'TextChannel',
      server: serverId,
      name,
      description
    };

    await db.channels.insertOne(channel as any);

    // Add channel to server's channel list
    await db.servers.updateOne(
      { _id: serverId },
      { $push: { channels: channelId } as any }
    );

    res.json(channel);
  } catch (error) {
    console.error('Error creating channel:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get server channels
serversRouter.get('/:serverId/channels', authenticate, async (req: AuthRequest, res) => {
  try {
    const { serverId } = req.params;

    // Check if user is server member
    const member = await db.members.findOne({
      '_id.server': serverId,
      '_id.user': req.userId
    });

    if (!member) {
      return res.status(403).json({ error: 'Forbidden: Not a server member' });
    }

    const channels = await db.channels.find({ server: serverId }).toArray();
    res.json(channels);
  } catch (error) {
    console.error('Error fetching channels:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get server members
serversRouter.get('/:serverId/members', authenticate, async (req: AuthRequest, res) => {
  try {
    const { serverId } = req.params;

    // Check if user is server member
    const userMember = await db.members.findOne({
      '_id.server': serverId,
      '_id.user': req.userId
    });

    if (!userMember) {
      return res.status(403).json({ error: 'Forbidden: Not a server member' });
    }

    // Get all members of the server
    const members = await db.members.find({
      '_id.server': serverId
    }).toArray();

    // Fetch user details for each member
    const userIds = members.map(m => m._id.user);
    const users = await db.users.find({ _id: { $in: userIds } }).toArray();

    // Get presence status for each user
    const membersWithPresence = await Promise.all(
      members.map(async (member) => {
        const userInfo = users.find(u => u._id === member.user);
        const online = await db.getPresence(member._id.user);
        
        return {
          ...member,
          user: userInfo,
          online
        };
      })
    );

    res.json(membersWithPresence);
  } catch (error) {
    console.error('Error fetching members:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
