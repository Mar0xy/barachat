import * as dotenv from 'dotenv';

dotenv.config();

export interface DatabaseConfig {
  mongodb: string;
  redis: string;
}

export interface ServerConfig {
  apiPort: number;
  wsPort: number;
  host: string;
}

export interface Config {
  database: DatabaseConfig;
  server: ServerConfig;
  jwtSecret: string;
  appUrl: string;
}

function getConfig(): Config {
  return {
    database: {
      mongodb: process.env.MONGODB_URI || 'mongodb://localhost:27017/barachat',
      redis: process.env.REDIS_URL || 'redis://localhost:6379'
    },
    server: {
      apiPort: parseInt(process.env.API_PORT || '3000', 10),
      wsPort: parseInt(process.env.WS_PORT || '3001', 10),
      host: process.env.HOST || '0.0.0.0'
    },
    jwtSecret: process.env.JWT_SECRET || 'change-me-in-production',
    appUrl: process.env.APP_URL || 'http://localhost:5173'
  };
}

export const config = getConfig();
