import { Accessor, Setter } from 'solid-js';
import { WS_URL } from '../utils/constants';
import { User, Server, Channel, Message, Friend, Member } from '../types';

export interface WebSocketHandlers {
  onMessage: (message: Message, currentChannel: string) => void;
  onMessageDelete: (messageId: string) => void;
  onUserUpdate: (userId: string, data: any) => void;
  onTyping: (channel: string, username: string) => void;
  onStopTyping: (channel: string, username: string) => void;
  onServerDelete: (serverId: string, currentServerId: string) => void;
  onServerMemberJoin: (serverId: string, currentServerId: string) => void;
  onServerMemberLeave: (serverId: string, currentServerId: string) => void;
  onChannelCreate: (channel: Channel, currentServerId: string) => void;
  onChannelUpdate: (channelId: string, data: any) => void;
  onChannelDelete: (channelId: string, currentChannelId: string) => void;
  onUserRelationship: () => void;
}

export function connectWebSocket(token: string, handlers: WebSocketHandlers): WebSocket {
  const websocket = new WebSocket(WS_URL);

  websocket.onopen = () => {
    console.log('WebSocket connected');
    websocket.send(JSON.stringify({ type: 'Authenticate', token }));
  };

  websocket.onmessage = (event) => {
    const data = JSON.parse(event.data);

    switch (data.type) {
      case 'Message':
        if (data.message) {
          handlers.onMessage(data.message, data.message.channel);
        }
        break;

      case 'MessageDelete':
        if (data.id) {
          handlers.onMessageDelete(data.id);
        }
        break;

      case 'UserUpdate':
        if (data.id && data.data) {
          handlers.onUserUpdate(data.id, data.data);
        }
        break;

      case 'Typing':
        if (data.channel && data.username) {
          handlers.onTyping(data.channel, data.username);
        }
        break;

      case 'StopTyping':
        if (data.channel && data.username) {
          handlers.onStopTyping(data.channel, data.username);
        }
        break;

      case 'ServerDelete':
        if (data.id) {
          handlers.onServerDelete(data.id, data.id);
        }
        break;

      case 'ServerMemberJoin':
        if (data.serverId) {
          handlers.onServerMemberJoin(data.serverId, data.serverId);
        }
        break;

      case 'ServerMemberLeave':
        if (data.serverId) {
          handlers.onServerMemberLeave(data.serverId, data.serverId);
        }
        break;

      case 'ChannelCreate':
        if (data.channel) {
          handlers.onChannelCreate(data.channel, data.channel.server);
        }
        break;

      case 'ChannelUpdate':
        if (data.id && data.data) {
          handlers.onChannelUpdate(data.id, data.data);
        }
        break;

      case 'ChannelDelete':
        if (data.id) {
          handlers.onChannelDelete(data.id, data.id);
        }
        break;

      case 'UserRelationship':
        handlers.onUserRelationship();
        break;
    }
  };

  websocket.onclose = () => {
    console.log('WebSocket disconnected');
  };

  websocket.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  return websocket;
}

export function sendTypingIndicator(
  ws: WebSocket | null,
  channel: string,
  username: string
) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;

  ws.send(
    JSON.stringify({
      type: 'Typing',
      channel,
      username
    })
  );
}

export function sendStopTyping(ws: WebSocket | null, channel: string) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;

  ws.send(
    JSON.stringify({
      type: 'StopTyping',
      channel
    })
  );
}
