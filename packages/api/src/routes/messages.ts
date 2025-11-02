import { Router, type Router as ExpressRouter } from 'express';
import { ulid } from 'ulid';
import { db } from '@barachat/database';
import { authenticate, AuthRequest } from '../middleware/auth';

export const messagesRouter: ExpressRouter = Router();

// Send message
messagesRouter.post('/:channelId/messages', authenticate, async (req: AuthRequest, res) => {
  try {
    const { content, nonce } = req.body;
    const { channelId } = req.params;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const message = {
      _id: ulid(),
      nonce,
      channel: channelId,
      author: req.userId!,
      content
    };

    await db.messages.insertOne(message as any);

    // Update channel's last message
    await db.channels.updateOne(
      { _id: channelId },
      { $set: { lastMessageId: message._id } }
    );

    res.json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get messages
messagesRouter.get('/:channelId/messages', authenticate, async (req: AuthRequest, res) => {
  try {
    const { channelId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const before = req.query.before as string;

    const query: any = { channel: channelId };
    if (before) {
      query._id = { $lt: before };
    }

    const messages = await db.messages
      .find(query)
      .sort({ _id: -1 })
      .limit(limit)
      .toArray();

    res.json(messages.reverse());
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
