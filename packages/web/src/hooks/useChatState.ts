import { createSignal, onMount, createEffect, Accessor, Setter } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { User, Server, Channel, Message, Friend, Member } from '../types';
import { userApi, serverApi, channelApi, messageApi, friendApi, uploadApi } from '../services/api';
import { connectWebSocket, sendTypingIndicator, sendStopTyping } from './useWebSocket';

export function useChatState() {
  const navigate = useNavigate();

  // Core state
  const [user, setUser] = createSignal<User | null>(null);
  const [servers, setServers] = createSignal<Server[]>([]);
  const [currentServer, setCurrentServer] = createSignal<string>('');
  const [channels, setChannels] = createSignal<Channel[]>([]);
  const [currentChannel, setCurrentChannel] = createSignal<string>('');
  const [messages, setMessages] = createSignal<Message[]>([]);
  const [messageInput, setMessageInput] = createSignal('');
  const [ws, setWs] = createSignal<WebSocket | null>(null);

  // UI state
  const [showCreateServer, setShowCreateServer] = createSignal(false);
  const [showUserSettings, setShowUserSettings] = createSignal(false);
  const [showServerSettings, setShowServerSettings] = createSignal(false);
  const [showCreateChannel, setShowCreateChannel] = createSignal(false);
  const [editingChannel, setEditingChannel] = createSignal<Channel | null>(null);
  const [lightboxImage, setLightboxImage] = createSignal<string | null>(null);
  const [showUserProfile, setShowUserProfile] = createSignal<User | null>(null);

  // Additional state
  const [typingUsers, setTypingUsers] = createSignal<Map<string, Set<string>>>(new Map());
  const [typingTimeout, setTypingTimeout] = createSignal<number | null>(null);
  const [uploadingAttachment, setUploadingAttachment] = createSignal(false);
  const [pendingAttachments, setPendingAttachments] = createSignal<string[]>([]);
  const [friends, setFriends] = createSignal<Friend[]>([]);
  const [members, setMembers] = createSignal<Member[]>([]);
  const [serverChannelMemory, setServerChannelMemory] = createSignal<Record<string, string>>({});
  const [dmChannels, setDmChannels] = createSignal<any[]>([]);

  // Load functions using API service
  const loadUser = async () => {
    const userData = await userApi.getMe();
    if (userData) setUser(userData);
  };

  const loadServers = async () => {
    const serverData = await serverApi.getServers();
    setServers(serverData);
  };

  const loadFriends = async () => {
    const friendData = await friendApi.getFriends();
    setFriends(friendData);
  };

  const loadMembers = async (serverId: string) => {
    const memberData = await serverApi.getMembers(serverId);
    setMembers(memberData);
  };

  const loadDMChannels = async () => {
    const dmData = await channelApi.getDMChannels();
    setDmChannels(dmData);
  };

  const loadChannels = async (serverId: string) => {
    const channelData = await channelApi.getChannels(serverId);
    setChannels(channelData);

    const memory = serverChannelMemory();
    if (!currentChannel() && channelData.length > 0) {
      const savedChannel = memory[serverId];
      if (savedChannel && channelData.some(c => c._id === savedChannel)) {
        setCurrentChannel(savedChannel);
      } else {
        const firstTextChannel = channelData.find(c => c.channelType === 'Text');
        if (firstTextChannel) setCurrentChannel(firstTextChannel._id);
      }
    }
  };

  const loadMessages = async (channelId: string) => {
    const messageData = await messageApi.getMessages(channelId);
    setMessages(messageData);
  };

  const loadUserProfile = async (userId: string) => {
    const userData = await userApi.getUser(userId);
    if (userData) setShowUserProfile(userData);
  };

  // Action functions
  const createOrOpenDM = async (userId: string) => {
    const dmChannel = await channelApi.createDM(userId);
    if (dmChannel) {
      setCurrentServer('');
      setCurrentChannel(dmChannel._id);
      await loadDMChannels();
      loadMessages(dmChannel._id);
      setShowUserProfile(null);
    }
  };

  const sendMessage = async () => {
    if (!messageInput().trim() && pendingAttachments().length === 0) return;

    const message = await messageApi.sendMessage(
      currentChannel(),
      messageInput(),
      pendingAttachments()
    );

    if (message) {
      setMessages([...messages(), message]);
      setMessageInput('');
      setPendingAttachments([]);
    }
  };

  const deleteMessage = async (messageId: string) => {
    const success = await messageApi.deleteMessage(currentChannel(), messageId);
    if (success) {
      setMessages(messages().filter(m => m._id !== messageId));
    }
  };

  const createServer = async (name: string, description: string) => {
    const server = await serverApi.createServer(name, description);
    if (server) {
      setServers([...servers(), server]);
      setShowCreateServer(false);
      setCurrentServer(server._id);
    }
  };

  const joinServer = (server: Server) => {
    if (!servers().some(s => s._id === server._id)) {
      setServers([...servers(), server]);
    }
    setShowCreateServer(false);
    setCurrentServer(server._id);
  };

  const createChannel = (channel: Channel) => {
    if (!channels().some(c => c._id === channel._id)) {
      setChannels([...channels(), channel]);
    }
    setShowCreateChannel(false);
  };

  const updateChannel = async (channelId: string, name: string, category?: string) => {
    const updated = await channelApi.updateChannel(channelId, name, category);
    if (updated) {
      setChannels(channels().map(c => c._id === channelId ? updated : c));
      setEditingChannel(null);
    }
  };

  const deleteChannel = async (channelId: string, deleteChannels?: boolean) => {
    const channel = channels().find(c => c._id === channelId);
    const success = await channelApi.deleteChannel(
      channelId,
      channel?.channelType === 'Category' ? currentServer() : undefined,
      deleteChannels
    );

    if (success) {
      setChannels(channels().filter(c => c._id !== channelId));
      if (currentChannel() === channelId) setCurrentChannel('');
    }
  };

  const uploadAttachment = async (file: File) => {
    setUploadingAttachment(true);
    try {
      const url = await uploadApi.uploadAttachment(file);
      if (url) {
        setPendingAttachments([...pendingAttachments(), url]);
      }
    } finally {
      setUploadingAttachment(false);
    }
  };

  const removePendingAttachment = (url: string) => {
    setPendingAttachments(pendingAttachments().filter(a => a !== url));
  };

  const handleTyping = () => {
    const socket = ws();
    if (!socket || socket.readyState !== WebSocket.OPEN) return;

    sendTypingIndicator(socket, currentChannel(), user()?.displayName || user()?.username || 'User');

    if (typingTimeout()) clearTimeout(typingTimeout()!);

    const timeout = setTimeout(() => {
      sendStopTyping(socket, currentChannel());
    }, 3000);

    setTypingTimeout(timeout as any);
  };

  const handleChannelSelect = (channelId: string) => {
    setCurrentChannel(channelId);
    const serverId = currentServer();
    if (serverId) {
      setServerChannelMemory({ ...serverChannelMemory(), [serverId]: channelId });
    }
  };

  return {
    // State
    user, setUser,
    servers, setServers,
    currentServer, setCurrentServer,
    channels, setChannels,
    currentChannel, setCurrentChannel,
    messages, setMessages,
    messageInput, setMessageInput,
    ws, setWs,
    showCreateServer, setShowCreateServer,
    showUserSettings, setShowUserSettings,
    showServerSettings, setShowServerSettings,
    showCreateChannel, setShowCreateChannel,
    editingChannel, setEditingChannel,
    lightboxImage, setLightboxImage,
    showUserProfile, setShowUserProfile,
    typingUsers, setTypingUsers,
    uploadingAttachment,
    pendingAttachments,
    friends, setFriends,
    members, setMembers,
    dmChannels, setDmChannels,

    // Functions
    loadUser,
    loadServers,
    loadFriends,
    loadMembers,
    loadDMChannels,
    loadChannels,
    loadMessages,
    loadUserProfile,
    createOrOpenDM,
    sendMessage,
    deleteMessage,
    createServer,
    joinServer,
    createChannel,
    updateChannel,
    deleteChannel,
    uploadAttachment,
    removePendingAttachment,
    handleTyping,
    handleChannelSelect,
    navigate
  };
}
