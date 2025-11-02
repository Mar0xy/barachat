import express from 'express';
import cors from 'cors';
import path from 'path';
import { config } from '@barachat/config';
import { db } from '@barachat/database';
import { authRouter } from './routes/auth';
import { usersRouter } from './routes/users';
import { channelsRouter } from './routes/channels';
import { serversRouter } from './routes/servers';
import { messagesRouter } from './routes/messages';
import { uploadsRouter } from './routes/uploads';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Routes
app.get('/', (req, res) => {
  res.json({ 
    name: 'Barachat API',
    version: '0.1.0',
    revolt: 'compatible'
  });
});

app.use('/auth', authRouter);
app.use('/users', usersRouter);
app.use('/channels', channelsRouter);
app.use('/servers', serversRouter);
app.use('/channels', messagesRouter);
app.use('/upload', uploadsRouter);

async function start() {
  try {
    await db.connect();
    
    app.listen(config.server.apiPort, config.server.host, () => {
      console.log(`API server running on http://${config.server.host}:${config.server.apiPort}`);
    });
  } catch (error) {
    console.error('Failed to start API server:', error);
    process.exit(1);
  }
}

start();
