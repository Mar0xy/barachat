import { Router, type Router as ExpressRouter } from 'express';
import { ulid } from 'ulid';
import { db } from '@barachat/database';
import { EventType } from '@barachat/models';
import { authenticate, AuthRequest } from '../middleware/auth';

export const usersRouter: ExpressRouter = Router();

// Get current user
usersRouter.get('/@me', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = await db.users.findOne({ _id: req.userId });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search users
usersRouter.get('/search', authenticate, async (req: AuthRequest, res) => {
  try {
    const query = req.query.q as string;
    
    if (!query) {
      return res.status(400).json({ error: 'Query parameter required' });
    }

    // Parse username#discriminator format or just username
    const parts = query.split('#');
    const username = parts[0];
    const discriminator = parts[1];

    const searchQuery: any = {
      username: { $regex: username, $options: 'i' }
    };

    if (discriminator) {
      searchQuery.discriminator = discriminator;
    }

    // Exclude the current user from search results
    searchQuery._id = { $ne: req.userId };

    const users = await db.users.find(searchQuery).limit(10).toArray();
    res.json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user by ID
usersRouter.get('/:userId', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = await db.users.findOne({ _id: req.params.userId });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user
usersRouter.patch('/@me', authenticate, async (req: AuthRequest, res) => {
  try {
    const { displayName, status, avatar, bio } = req.body;
    
    const update: any = {};
    if (displayName !== undefined) update.displayName = displayName;
    if (status !== undefined) update.status = status;
    if (avatar !== undefined) update.avatar = avatar;
    if (bio !== undefined) update.bio = bio;

    await db.users.updateOne(
      { _id: req.userId },
      { $set: update }
    );

    const user = await db.users.findOne({ _id: req.userId });
    
    // Broadcast user update to all connected clients via Redis
    if (user && Object.keys(update).length > 0) {
      await db.publishEvent({
        type: EventType.UserUpdate,
        id: user._id,
        data: {
          displayName: user.displayName,
          avatar: user.avatar,
          status: user.status,
          bio: user.bio
        }
      });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user relationships/friends
usersRouter.get('/@me/relationships', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = await db.users.findOne({ _id: req.userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get all relationship records where this user is involved
    const relationships = await db.getRedis().hGetAll(`relationships:${req.userId}`) || {};
    
    // Fetch user details for each relationship
    const friendIds = Object.keys(relationships);
    const friends = await db.users.find({ _id: { $in: friendIds } }).toArray();
    
    const result = friends.map(friend => ({
      ...friend,
      relationshipStatus: relationships[friend._id]
    }));

    res.json(result);
  } catch (error) {
    console.error('Error fetching relationships:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send friend request
usersRouter.post('/@me/relationships/:userId', authenticate, async (req: AuthRequest, res) => {
  try {
    const targetUserId = req.params.userId;
    
    if (targetUserId === req.userId) {
      return res.status(400).json({ error: 'Cannot add yourself as a friend' });
    }

    const targetUser = await db.users.findOne({ _id: targetUserId });
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Set outgoing request for requester
    await db.getRedis().hSet(`relationships:${req.userId}`, targetUserId, 'Outgoing');
    // Set incoming request for target
    await db.getRedis().hSet(`relationships:${targetUserId}`, req.userId!, 'Incoming');

    // Broadcast to both users
    await db.publishEvent({
      type: EventType.UserRelationship,
      userId: req.userId!
    });
    
    await db.publishEvent({
      type: EventType.UserRelationship,
      userId: targetUserId
    });

    res.json({ status: 'Friend request sent' });
  } catch (error) {
    console.error('Error sending friend request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Accept/reject friend request
usersRouter.put('/@me/relationships/:userId', authenticate, async (req: AuthRequest, res) => {
  try {
    const targetUserId = req.params.userId;
    const { action } = req.body; // 'accept' or 'reject'

    if (action === 'accept') {
      // Set both as friends
      await db.getRedis().hSet(`relationships:${req.userId}`, targetUserId, 'Friend');
      await db.getRedis().hSet(`relationships:${targetUserId}`, req.userId!, 'Friend');
      
      // Create DM channel for both users
      const dmChannelId = ulid();
      const dmChannel = {
        _id: dmChannelId,
        channelType: 'DirectMessage',
        recipients: [req.userId!, targetUserId]
      };
      
      await db.channels.insertOne(dmChannel as any);
      
      // Broadcast to both users
      await db.publishEvent({
        type: EventType.UserRelationship,
        userId: req.userId!
      });
      
      await db.publishEvent({
        type: EventType.UserRelationship,
        userId: targetUserId
      });
      
      res.json({ status: 'Friend request accepted' });
    } else if (action === 'reject') {
      // Remove relationship
      await db.getRedis().hDel(`relationships:${req.userId}`, targetUserId);
      await db.getRedis().hDel(`relationships:${targetUserId}`, req.userId!);
      
      // Broadcast to both users
      await db.publishEvent({
        type: EventType.UserRelationship,
        userId: req.userId!
      });
      
      await db.publishEvent({
        type: EventType.UserRelationship,
        userId: targetUserId
      });
      
      res.json({ status: 'Friend request rejected' });
    } else {
      res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Error handling friend request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove friend
usersRouter.delete('/@me/relationships/:userId', authenticate, async (req: AuthRequest, res) => {
  try {
    const targetUserId = req.params.userId;
    
    await db.getRedis().hDel(`relationships:${req.userId}`, targetUserId);
    await db.getRedis().hDel(`relationships:${targetUserId}`, req.userId!);

    // Broadcast to both users
    await db.publishEvent({
      type: EventType.UserRelationship,
      userId: req.userId!
    });
    
    await db.publishEvent({
      type: EventType.UserRelationship,
      userId: targetUserId
    });

    res.json({ status: 'Friend removed' });
  } catch (error) {
    console.error('Error removing friend:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
