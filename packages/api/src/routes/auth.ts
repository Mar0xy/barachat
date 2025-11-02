import { Router, type Router as ExpressRouter } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { ulid } from 'ulid';
import { db } from '@barachat/database';
import { config } from '@barachat/config';
import { authenticate, AuthRequest } from '../middleware/auth';
import { EventType } from '@barachat/models';

export const authRouter: ExpressRouter = Router();

// Register
authRouter.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user exists
    const existing = await db.users.findOne({ 
      $or: [{ username }, { email }] 
    });

    if (existing) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const userId = ulid();
    const user = {
      _id: userId,
      username,
      email,
      password: hashedPassword,
      discriminator: Math.floor(1000 + Math.random() * 9000).toString(),
      flags: 0,
      badges: 0
    };

    await db.users.insertOne(user as any);

    // Generate token
    const token = jwt.sign({ userId }, config.jwtSecret, { expiresIn: '7d' });

    // Remove password from response
    const { password: _password, ...userWithoutPassword } = user;

    res.json({
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Find user
    const user = await db.users.findOne({ email }) as any;

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign({ userId: user._id }, config.jwtSecret, { expiresIn: '7d' });

    // Set user presence to online
    await db.getRedis().set(`presence:${user._id}`, 'Online');
    
    // Update user status in database
    await db.users.updateOne(
      { _id: user._id },
      { $set: { 'status.presence': 'Online' } }
    );
    
    // Broadcast user update
    await db.publishEvent({
      type: EventType.UserUpdate,
      id: user._id,
      data: {
        status: {
          ...user.status,
          presence: 'Online'
        }
      }
    });

    // Remove password from response
    const { password: _password2, ...userWithoutPassword } = user;

    res.json({
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout
authRouter.post('/logout', authenticate, async (req: AuthRequest, res) => {
  try {
    // Set user presence to offline
    await db.setPresence(req.userId!, false);

    // Broadcast offline status
    await db.publishEvent({
      type: EventType.UserPresence,
      id: req.userId!,
      online: false
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
