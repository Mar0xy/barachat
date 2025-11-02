import { Router, type Router as ExpressRouter } from 'express';
import { ulid } from 'ulid';
import { db } from '@barachat/database';
import { EventType } from '@barachat/models';
import { authenticate, AuthRequest } from '../middleware/auth';

export const messagesRouter: ExpressRouter = Router();

// Send message
messagesRouter.post('/:channelId/messages', authenticate, async (req: AuthRequest, res) => {
  try {
    const { content, nonce, attachments } = req.body;
    const { channelId } = req.params;

    if (!content && (!attachments || attachments.length === 0)) {
      return res.status(400).json({ error: 'Content or attachments are required' });
    }

    const message = {
      _id: ulid(),
      nonce,
      channel: channelId,
      author: req.userId!,
      content: content || '',
      attachments: attachments || []
    };

    await db.messages.insertOne(message as any);

    // Update channel's last message
    await db.channels.updateOne(
      { _id: channelId },
      { $set: { lastMessageId: message._id } }
    );

    // Populate author information for response
    const author = await db.users.findOne({ _id: req.userId! });
    const messageWithAuthor = {
      ...message,
      author: author ? {
        _id: author._id,
        username: author.username,
        discriminator: author.discriminator,
        displayName: author.displayName,
        avatar: author.avatar
      } : { _id: req.userId!, username: 'Unknown', discriminator: '0000' }
    };

    // Broadcast message to all other connected clients in the channel via Redis
    await db.publishEvent({
      type: EventType.Message,
      channelId: channelId,
      message: messageWithAuthor,
      excludeUserId: req.userId!
    });

    res.json(messageWithAuthor);
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

    // Populate author information
    const messagesWithAuthors = await Promise.all(
      messages.map(async (message) => {
        const author = await db.users.findOne({ _id: message.author });
        return {
          ...message,
          author: author ? {
            _id: author._id,
            username: author.username,
            discriminator: author.discriminator,
            displayName: author.displayName,
            avatar: author.avatar
          } : { _id: message.author, username: 'Unknown', discriminator: '0000' }
        };
      })
    );

    res.json(messagesWithAuthors.reverse());
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete message
messagesRouter.delete('/:channelId/messages/:messageId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { channelId, messageId } = req.params;

    // Find the message
    const message = await db.messages.findOne({ _id: messageId, channel: channelId });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Check if user is the author
    if (message.author !== req.userId) {
      return res.status(403).json({ error: 'You can only delete your own messages' });
    }

    // Delete the message
    await db.messages.deleteOne({ _id: messageId });

    // Broadcast message deletion via Redis
    await db.publishEvent({
      type: EventType.MessageDelete,
      channelId: channelId,
      id: messageId,
      channel: channelId
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
