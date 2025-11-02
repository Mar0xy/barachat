import { Router, type Router as ExpressRouter } from 'express';
import { ulid } from 'ulid';
import { db } from '@barachat/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { EventType } from '@barachat/models';

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
    
    // Broadcast server update via Redis
    await db.publishEvent({
      type: EventType.ServerUpdate,
      id: serverId,
      data: update
    });
    
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
    const { name, description, channelType, category } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Check if user is server owner
    const server = await db.servers.findOne({ _id: serverId });
    
    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    if (server.owner !== req.userId) {
      return res.status(403).json({ error: 'Forbidden: Only server owner can create channels' });
    }

    const channelId = ulid();

    const channel = {
      _id: channelId,
      channelType: channelType || 'TextChannel',
      server: serverId,
      name,
      description,
      ...(category && { category })
    };

    await db.channels.insertOne(channel as any);

    // Add channel to server's channel list
    await db.servers.updateOne(
      { _id: serverId },
      { $push: { channels: channelId } as any }
    );

    // Broadcast channel creation to server members via Redis
    await db.publishEvent({
      type: EventType.ChannelCreate,
      channel: channel,
      serverId: serverId
    });

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
        const userInfo = users.find(u => u._id === member._id.user);
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

// Create server invite
serversRouter.post('/:serverId/invites', authenticate, async (req: AuthRequest, res) => {
  try {
    const { serverId } = req.params;
    const { maxUses, expiresIn } = req.body; // expiresIn in seconds

    // Check if user is server member
    const member = await db.members.findOne({
      '_id.server': serverId,
      '_id.user': req.userId
    });

    if (!member) {
      return res.status(403).json({ error: 'Forbidden: Not a server member' });
    }

    const server = await db.servers.findOne({ _id: serverId });
    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    const inviteId = ulid();
    const now = new Date();
    
    const invite = {
      _id: inviteId,
      server: serverId,
      creator: req.userId!,
      channel: server.channels[0], // Default to first channel
      maxUses: maxUses || 0, // 0 = unlimited
      uses: 0,
      expiresAt: expiresIn ? new Date(now.getTime() + expiresIn * 1000) : undefined,
      createdAt: now
    };

    await db.invites.insertOne(invite as any);

    res.json(invite);
  } catch (error) {
    console.error('Error creating invite:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get server invites
serversRouter.get('/:serverId/invites', authenticate, async (req: AuthRequest, res) => {
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

    const invites = await db.invites.find({ server: serverId }).toArray();
    res.json(invites);
  } catch (error) {
    console.error('Error fetching invites:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete server invite
serversRouter.delete('/:serverId/invites/:inviteId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { serverId, inviteId } = req.params;

    // Check if user is server member
    const member = await db.members.findOne({
      '_id.server': serverId,
      '_id.user': req.userId
    });

    if (!member) {
      return res.status(403).json({ error: 'Forbidden: Not a server member' });
    }

    await db.invites.deleteOne({ _id: inviteId, server: serverId });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting invite:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Join server via invite
serversRouter.post('/join/:inviteCode', authenticate, async (req: AuthRequest, res) => {
  try {
    const { inviteCode } = req.params;

    // Find invite
    const invite = await db.invites.findOne({ _id: inviteCode }) as any;
    
    if (!invite) {
      return res.status(404).json({ error: 'Invite not found' });
    }

    // Check if invite has expired
    if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
      return res.status(400).json({ error: 'Invite has expired' });
    }

    // Check if invite has reached max uses
    if (invite.maxUses > 0 && invite.uses >= invite.maxUses) {
      return res.status(400).json({ error: 'Invite has reached maximum uses' });
    }

    // Check if user is already a member
    const existingMember = await db.members.findOne({
      '_id.server': invite.server,
      '_id.user': req.userId
    });

    if (existingMember) {
      // Return the server even if already a member
      const server = await db.servers.findOne({ _id: invite.server });
      return res.json(server);
    }

    // Add user as member
    const member = {
      _id: {
        server: invite.server,
        user: req.userId!
      },
      roles: []
    };

    await db.members.insertOne(member as any);

    // Increment invite uses
    await db.invites.updateOne(
      { _id: inviteCode },
      { $inc: { uses: 1 } as any }
    );
    
    // Check if invite has reached max uses and delete if so
    const updatedInvite = await db.invites.findOne({ _id: inviteCode }) as any;
    if (updatedInvite && updatedInvite.maxUses > 0 && updatedInvite.uses >= updatedInvite.maxUses) {
      await db.invites.deleteOne({ _id: inviteCode });
    }

    // Get server info
    const server = await db.servers.findOne({ _id: invite.server });

    // Broadcast member join event
    await db.publishEvent({
      type: EventType.ServerMemberJoin,
      serverId: invite.server,
      userId: req.userId!
    });

    res.json(server);
  } catch (error) {
    console.error('Error joining server:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Leave server
serversRouter.post('/:serverId/leave', authenticate, async (req: AuthRequest, res) => {
  try {
    const { serverId } = req.params;

    const server = await db.servers.findOne({ _id: serverId });
    
    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    // Check if user is the owner
    if (server.owner === req.userId) {
      // Delete the entire server if owner leaves
      
      // Get all channels first (before deleting them)
      const channels = await db.channels.find({ server: serverId }).toArray();
      const channelIds = channels.map(c => c._id);
      
      // Delete all messages in those channels
      await db.messages.deleteMany({ channel: { $in: channelIds } });
      
      // Delete all channels
      await db.channels.deleteMany({ server: serverId });
      
      // Delete all members
      await db.members.deleteMany({ '_id.server': serverId } as any);
      
      // Delete all invites
      await db.invites.deleteMany({ server: serverId });
      
      // Delete server
      await db.servers.deleteOne({ _id: serverId });

      // Broadcast server deletion
      await db.publishEvent({
        type: EventType.ServerDelete,
        id: serverId
      });

      return res.json({ success: true, deleted: true });
    }

    // Remove user as member
    await db.members.deleteOne({
      '_id.server': serverId,
      '_id.user': req.userId
    } as any);

    // Broadcast member leave event
    await db.publishEvent({
      type: EventType.ServerMemberLeave,
      serverId: serverId,
      userId: req.userId!
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error leaving server:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete category and optionally its channels
serversRouter.delete('/:serverId/categories/:categoryId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { serverId, categoryId } = req.params;
    const { deleteChannels } = req.query; // ?deleteChannels=true to delete channels too

    // Check if user is server owner
    const server = await db.servers.findOne({ _id: serverId });
    
    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    if (server.owner !== req.userId) {
      return res.status(403).json({ error: 'Forbidden: Only server owner can delete categories' });
    }

    // Find channels in this category
    const channelsInCategory = await db.channels.find({ 
      server: serverId,
      category: categoryId 
    }).toArray();

    if (deleteChannels === 'true') {
      // Delete all channels in the category
      for (const channel of channelsInCategory) {
        await db.channels.deleteOne({ _id: channel._id });
        await db.messages.deleteMany({ channel: channel._id });
        
        // Broadcast channel deletion
        await db.publishEvent({
          type: EventType.ChannelDelete,
          id: channel._id,
          serverId: serverId
        });
      }
    } else {
      // Just remove the category reference from channels
      await db.channels.updateMany(
        { server: serverId, category: categoryId },
        { $unset: { category: '' } } as any
      );

      // Broadcast channel updates
      for (const channel of channelsInCategory) {
        await db.publishEvent({
          type: EventType.ChannelUpdate,
          id: channel._id,
          data: { category: null },
          clear: ['category'],
          serverId: serverId
        });
      }
    }

    // Delete the category channel itself
    await db.channels.deleteOne({ _id: categoryId });

    // Remove category from server
    if (server.categories) {
      const updatedCategories = server.categories.filter(c => c.id !== categoryId);
      await db.servers.updateOne(
        { _id: serverId },
        { $set: { categories: updatedCategories } }
      );
    }

    // Broadcast category deletion
    await db.publishEvent({
      type: EventType.ChannelDelete,
      id: categoryId,
      serverId: serverId
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
