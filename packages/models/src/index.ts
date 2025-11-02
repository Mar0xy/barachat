export interface User {
  _id: string;
  username: string;
  discriminator: string;
  displayName?: string;
  avatar?: string;
  badges?: number;
  status?: UserStatus;
  relationship?: RelationshipStatus;
  online?: boolean;
  flags?: number;
  bot?: {
    owner: string;
  };
}

export interface UserStatus {
  text?: string;
  presence?: 'Online' | 'Idle' | 'Busy' | 'Invisible';
}

export enum RelationshipStatus {
  None = 'None',
  User = 'User',
  Friend = 'Friend',
  Outgoing = 'Outgoing',
  Incoming = 'Incoming',
  Blocked = 'Blocked',
  BlockedOther = 'BlockedOther'
}

export interface Server {
  _id: string;
  owner: string;
  name: string;
  description?: string;
  channels: string[];
  categories?: Category[];
  systemMessages?: SystemMessageChannels;
  roles?: { [key: string]: Role };
  defaultPermissions: number;
  icon?: string;
  banner?: string;
  flags?: number;
  nsfw?: boolean;
  analytics?: boolean;
  discoverable?: boolean;
}

export interface Category {
  id: string;
  title: string;
  channels: string[];
}

export interface SystemMessageChannels {
  userJoined?: string;
  userLeft?: string;
  userKicked?: string;
  userBanned?: string;
}

export interface Role {
  name: string;
  permissions: Permission;
  colour?: string;
  hoist?: boolean;
  rank?: number;
}

export interface Permission {
  allow: number;
  deny: number;
}

export enum ChannelType {
  SavedMessages = 'SavedMessages',
  DirectMessage = 'DirectMessage',
  Group = 'Group',
  TextChannel = 'TextChannel',
  VoiceChannel = 'VoiceChannel'
}

export interface Channel {
  _id: string;
  channelType: ChannelType;
  name?: string;
  description?: string;
  icon?: string;
  recipients?: string[];
  active?: boolean;
  permissions?: number;
  rolePermissions?: { [key: string]: Permission };
  defaultPermissions?: Permission;
  lastMessageId?: string;
  server?: string;
  nsfw?: boolean;
}

export interface Message {
  _id: string;
  nonce?: string;
  channel: string;
  author: string;
  content?: string;
  attachments?: Attachment[];
  edited?: Date;
  embeds?: Embed[];
  mentions?: string[];
  replies?: string[];
  reactions?: { [key: string]: string[] };
  interactions?: Interactions;
  masquerade?: Masquerade;
}

export interface Attachment {
  _id: string;
  tag: string;
  filename: string;
  metadata: FileMetadata;
  contentType: string;
  size: number;
}

export interface FileMetadata {
  type: 'File' | 'Text' | 'Image' | 'Video' | 'Audio';
  width?: number;
  height?: number;
}

export interface Embed {
  type: 'Website' | 'Image' | 'Video' | 'Text';
  url?: string;
  title?: string;
  description?: string;
  image?: EmbedImage;
  video?: EmbedVideo;
  siteName?: string;
  iconUrl?: string;
  colour?: string;
}

export interface EmbedImage {
  url: string;
  width: number;
  height: number;
  size: 'Large' | 'Preview';
}

export interface EmbedVideo {
  url: string;
  width: number;
  height: number;
}

export interface Interactions {
  reactions?: string[];
  restrictReactions?: boolean;
}

export interface Masquerade {
  name?: string;
  avatar?: string;
  colour?: string;
}

export interface Invite {
  _id: string;
  server: string;
  creator: string;
  channel: string;
}

export interface Member {
  _id: {
    server: string;
    user: string;
  };
  nickname?: string;
  avatar?: string;
  roles?: string[];
  timeout?: Date;
}

export interface Emoji {
  _id: string;
  parent: {
    type: 'Server';
    id: string;
  };
  creator: string;
  name: string;
  animated?: boolean;
  nsfw?: boolean;
}

export * from './events';
