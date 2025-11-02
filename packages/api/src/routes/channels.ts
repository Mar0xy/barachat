import { Router, type Router as ExpressRouter } from 'express';
import { ulid } from 'ulid';
import { db } from '@barachat/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { ChannelType } from '@barachat/models';

export const channelsRouter: ExpressRouter = Router();

// Get channel
channelsRouter.get('/:channelId', authenticate, async (req: AuthRequest, res) => {
  try {
    const channel = await db.channels.findOne({ _id: req.params.channelId });
    
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    res.json(channel);
  } catch (error) {
    console.error('Error fetching channel:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update channel
channelsRouter.patch('/:channelId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { channelId } = req.params;
    const { name, description } = req.body;

    const channel = await db.channels.findOne({ _id: channelId }) as any;
    
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    // Check if user has permission (server owner or admin)
    if (channel.server) {
      const server = await db.servers.findOne({ _id: channel.server }) as any;
      if (!server || server.owner !== req.userId) {
        return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
      }
    }

    const update: any = {};
    if (name !== undefined) update.name = name;
    if (description !== undefined) update.description = description;

    await db.channels.updateOne(
      { _id: channelId },
      { $set: update }
    );

    const updatedChannel = await db.channels.findOne({ _id: channelId });
    res.json(updatedChannel);
  } catch (error) {
    console.error('Error updating channel:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create DM
channelsRouter.post('/create-dm', authenticate, async (req: AuthRequest, res) => {
  try {
    const { userId } = req.body;

    // Check if DM already exists
    const existing = await db.channels.findOne({
      channelType: ChannelType.DirectMessage,
      recipients: { $all: [req.userId, userId] }
    });

    if (existing) {
      return res.json(existing);
    }

    // Create new DM
    const channel = {
      _id: ulid(),
      channelType: ChannelType.DirectMessage,
      recipients: [req.userId!, userId],
      active: true
    };

    await db.channels.insertOne(channel as any);
    res.json(channel);
  } catch (error) {
    console.error('Error creating DM:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
