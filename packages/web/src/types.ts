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
  status?: {
    text?: string;
    presence?: 'Online' | 'Idle' | 'Busy' | 'Invisible';
  };
  relationshipStatus: 'Outgoing' | 'Incoming' | 'Friend';
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

export type ChannelType = 
  | 'SavedMessages'
  | 'DirectMessage'
  | 'Group'
  | 'TextChannel'
  | 'VoiceChannel'
  | 'Category';

export interface Channel {
  _id: string;
  channelType: ChannelType;
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
