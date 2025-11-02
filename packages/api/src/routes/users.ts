import { Router } from 'express';
import { db } from '@barachat/database';
import { authenticate, AuthRequest } from '../middleware/auth';

export const usersRouter = Router();

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
    const { displayName, status, avatar } = req.body;
    
    const update: any = {};
    if (displayName !== undefined) update.displayName = displayName;
    if (status !== undefined) update.status = status;
    if (avatar !== undefined) update.avatar = avatar;

    await db.users.updateOne(
      { _id: req.userId },
      { $set: update }
    );

    const user = await db.users.findOne({ _id: req.userId });
    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
