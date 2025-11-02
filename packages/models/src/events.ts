// WebSocket Events
export enum EventType {
  // Connection Events
  Authenticated = 'Authenticated',
  Ready = 'Ready',
  Pong = 'Pong',

  // Message Events
  Message = 'Message',
  MessageUpdate = 'MessageUpdate',
  MessageDelete = 'MessageDelete',
  MessageReact = 'MessageReact',
  MessageUnreact = 'MessageUnreact',
  MessageRemoveReaction = 'MessageRemoveReaction',

  // Channel Events
  ChannelCreate = 'ChannelCreate',
  ChannelUpdate = 'ChannelUpdate',
  ChannelDelete = 'ChannelDelete',
  ChannelGroupJoin = 'ChannelGroupJoin',
  ChannelGroupLeave = 'ChannelGroupLeave',
  ChannelStartTyping = 'ChannelStartTyping',
  ChannelStopTyping = 'ChannelStopTyping',
  ChannelAck = 'ChannelAck',

  // Server Events
  ServerUpdate = 'ServerUpdate',
  ServerDelete = 'ServerDelete',
  ServerMemberUpdate = 'ServerMemberUpdate',
  ServerMemberJoin = 'ServerMemberJoin',
  ServerMemberLeave = 'ServerMemberLeave',
  ServerRoleUpdate = 'ServerRoleUpdate',
  ServerRoleDelete = 'ServerRoleDelete',

  // User Events
  UserUpdate = 'UserUpdate',
  UserRelationship = 'UserRelationship',
  UserPresence = 'UserPresence',

  // Emoji Events
  EmojiCreate = 'EmojiCreate',
  EmojiDelete = 'EmojiDelete'
}

export interface WebSocketEvent {
  type: EventType;
}

export interface AuthenticatedEvent extends WebSocketEvent {
  type: EventType.Authenticated;
}

export interface ReadyEvent extends WebSocketEvent {
  type: EventType.Ready;
  users: any[];
  servers: any[];
  channels: any[];
  members: any[];
  emojis?: any[];
}

export interface MessageEvent extends WebSocketEvent {
  type: EventType.Message;
  message: any;
}

export interface MessageUpdateEvent extends WebSocketEvent {
  type: EventType.MessageUpdate;
  id: string;
  channel: string;
  data: any;
}

export interface MessageDeleteEvent extends WebSocketEvent {
  type: EventType.MessageDelete;
  id: string;
  channel: string;
}

export interface ChannelCreateEvent extends WebSocketEvent {
  type: EventType.ChannelCreate;
  channel: any;
}

export interface ChannelUpdateEvent extends WebSocketEvent {
  type: EventType.ChannelUpdate;
  id: string;
  data: any;
  clear?: string[];
}

export interface ChannelDeleteEvent extends WebSocketEvent {
  type: EventType.ChannelDelete;
  id: string;
}

export interface ServerUpdateEvent extends WebSocketEvent {
  type: EventType.ServerUpdate;
  id: string;
  data: any;
  clear?: string[];
}

export interface ServerDeleteEvent extends WebSocketEvent {
  type: EventType.ServerDelete;
  id: string;
}

export interface UserUpdateEvent extends WebSocketEvent {
  type: EventType.UserUpdate;
  id: string;
  data: any;
  clear?: string[];
}

export interface UserPresenceEvent extends WebSocketEvent {
  type: EventType.UserPresence;
  id: string;
  online: boolean;
}
