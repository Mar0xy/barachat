// Shared type definitions for the application

export interface User {
  _id: string;
  username: string;
  discriminator: string;
  displayName?: string;
  avatar?: string;
  bio?: string;
  status?: {
    text?: string;
    presence?: 'Online' | 'Idle' | 'Busy' | 'Invisible';
  };
  online?: boolean;
}

export interface Friend {
  _id: string;
  username: string;
  discriminator: string;
  displayName?: string;
  avatar?: string;
  online?: boolean;
  relationshipStatus: 'pending' | 'accepted' | 'blocked';
}

export interface Member {
  _id: {
    server: string;
    user: string;
  };
  user: User;
  online: boolean;
  nickname?: string;
}

export interface Server {
  _id: string;
  name: string;
  description?: string;
  owner: string;
  channels: string[];
  icon?: string;
}

export interface Channel {
  _id: string;
  channelType: 'text' | 'voice' | 'category' | 'dm';
  name?: string;
  recipients?: string[];
  server?: string;
  category?: string; // Parent category ID for text channels
  position?: number;
}

export interface Category {
  _id: string;
  name: string;
  server: string;
  position: number;
  channels: Channel[];
}

export interface Message {
  _id: string;
  author: {
    _id: string;
    username: string;
    discriminator: string;
    displayName?: string;
    avatar?: string;
  };
  content: string;
  channel: string;
  attachments?: string[];
  createdAt?: string;
}

export interface TypingUser {
  userId: string;
  username: string;
  timestamp: number;
}

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
export const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';
