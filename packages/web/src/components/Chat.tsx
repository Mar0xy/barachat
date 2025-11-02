import { Component, createSignal, Show, onMount, createEffect } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { CreateServerModal } from './modals/CreateServerModal';
import { UserSettingsModal } from './modals/UserSettingsModal';
import { ServerSettingsModal } from './modals/ServerSettingsModal';
import { CreateChannelModal } from './modals/CreateChannelModal';
import { UserProfileModal } from './modals/UserProfileModal';
import { FriendsList } from './FriendsList';
import { MembersList } from './MembersList';
import { User, Friend, Member, Server, Channel, Message } from '../types';
import { API_URL, WS_URL } from '../utils/constants';
import { ServerList } from './ServerList';
import { ChannelList } from './ChannelList';
import { ChatArea } from './ChatArea';
import { UserPanel } from './UserPanel';

export const Chat: Component = () => {
  const [user, setUser] = createSignal<User | null>(null);
  const [servers, setServers] = createSignal<Server[]>([]);
  const [currentServer, setCurrentServer] = createSignal<string>('');
  const [channels, setChannels] = createSignal<Channel[]>([]);
  const [currentChannel, setCurrentChannel] = createSignal<string>('');
  const [messages, setMessages] = createSignal<Message[]>([]);
  const [messageInput, setMessageInput] = createSignal('');
  const [ws, setWs] = createSignal<WebSocket | null>(null);
  const [showCreateServer, setShowCreateServer] = createSignal(false);
  const [showUserSettings, setShowUserSettings] = createSignal(false);
  const [showServerSettings, setShowServerSettings] = createSignal(false);
  const [showCreateChannel, setShowCreateChannel] = createSignal(false);
  const [typingUsers, setTypingUsers] = createSignal<Map<string, Set<string>>>(new Map());
  const [typingTimeout, setTypingTimeout] = createSignal<number | null>(null);
  const [lightboxImage, setLightboxImage] = createSignal<string | null>(null);
  const [uploadingAttachment, setUploadingAttachment] = createSignal(false);
  const [pendingAttachments, setPendingAttachments] = createSignal<string[]>([]);
  
  // New state for friends and members
  const [friends, setFriends] = createSignal<Friend[]>([]);
  const [members, setMembers] = createSignal<Member[]>([]);
  const [showUserProfile, setShowUserProfile] = createSignal<User | null>(null);
  const [serverChannelMemory, setServerChannelMemory] = createSignal<Record<string, string>>({});
  
  let fileInputRef: HTMLInputElement | undefined;
  const navigate = useNavigate();

  // Load user data
  const loadUser = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/users/@me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  // Load servers
  const loadServers = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/servers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const serverList = await response.json();
        setServers(serverList);
      }
    } catch (error) {
      console.error('Error loading servers:', error);
    }
  };

  // Load friends
  const loadFriends = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/users/@me/relationships`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const friendList = await response.json();
        setFriends(friendList);
      }
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  };

  // Load server members
  const loadMembers = async (serverId: string) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/servers/${serverId}/members`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const memberList = await response.json();
        setMembers(memberList);
      }
    } catch (error) {
      console.error('Error loading members:', error);
    }
  };

  // Load and show user profile
  const loadUserProfile = async (userId: string) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const userData = await response.json();
        setShowUserProfile(userData);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  // Load channels for current server
  const loadChannels = async (serverId: string) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/servers/${serverId}/channels`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const channelList = await response.json();
        setChannels(channelList);
        
        // Auto-select first channel if no channel is selected and no saved channel
        const memory = serverChannelMemory();
        if (!memory[serverId] && channelList.length > 0 && !currentChannel()) {
          const firstTextChannel = channelList.find((c: Channel) => c.channelType === 'TextChannel');
          if (firstTextChannel) {
            handleChannelSelect(firstTextChannel._id);
          }
        }
      }
    } catch (error) {
      console.error('Error loading channels:', error);
    }
  };

  // Load messages for current channel
  const loadMessages = async (channelId: string) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/channels/${channelId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const messageList = await response.json();
        setMessages(messageList);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!messageInput().trim() && pendingAttachments().length === 0) return;
    
    const token = localStorage.getItem('token');
    const channel = currentChannel();
    
    try {
      const response = await fetch(`${API_URL}/channels/${channel}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          content: messageInput(),
          attachments: pendingAttachments()
        })
      });

      if (response.ok) {
        setMessageInput('');
        setPendingAttachments([]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Delete message
  const deleteMessage = async (messageId: string) => {
    const token = localStorage.getItem('token');
    const channel = currentChannel();
    
    try {
      const response = await fetch(`${API_URL}/channels/${channel}/messages/${messageId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        setMessages(messages().filter(m => m._id !== messageId));
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  // Create server
  const createServer = async (name: string, description: string) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/servers/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name, description })
      });

      if (response.ok) {
        const server = await response.json();
        setServers([...servers(), server]);
        setShowCreateServer(false);
        setCurrentServer(server._id);
      }
    } catch (error) {
      console.error('Error creating server:', error);
    }
  };

  // Create channel
  const createChannel = (channel: Channel) => {
    setChannels([...channels(), channel]);
    setShowCreateChannel(false);
  };

  // Update user profile
  const updateUserProfile = async (updates: Partial<User>) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/users/@me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  // Update server
  const updateServer = async (serverId: string, updates: Partial<Server>) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/servers/${serverId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        const updatedServer = await response.json();
        setServers(servers().map(s => s._id === serverId ? updatedServer : s));
      }
    } catch (error) {
      console.error('Error updating server:', error);
    }
  };

  // Handle attachment upload
  const handleAttachmentUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    setUploadingAttachment(true);
    const token = localStorage.getItem('token');
    
    try {
      const uploadedUrls: string[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append('file', files[i]);
        
        const response = await fetch(`${API_URL}/upload/attachment`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });
        
        if (response.ok) {
          const data = await response.json();
          uploadedUrls.push(data.url);
        }
      }
      
      setPendingAttachments([...pendingAttachments(), ...uploadedUrls]);
    } catch (error) {
      console.error('Error uploading attachment:', error);
    } finally {
      setUploadingAttachment(false);
    }
  };

  // Remove pending attachment
  const removePendingAttachment = (url: string) => {
    setPendingAttachments(pendingAttachments().filter(a => a !== url));
  };

  // Handle typing indicator
  const handleTyping = () => {
    const socket = ws();
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    
    socket.send(JSON.stringify({
      type: 'Typing',
      channel: currentChannel(),
      username: user()?.displayName || user()?.username || 'User'
    }));
    
    // Clear existing timeout
    if (typingTimeout()) {
      clearTimeout(typingTimeout()!);
    }
    
    // Set new timeout to stop typing indicator
    const timeout = setTimeout(() => {
      socket.send(JSON.stringify({
        type: 'StopTyping',
        channel: currentChannel()
      }));
    }, 3000);
    
    setTypingTimeout(timeout as any);
  };

  // Effects
  createEffect(() => {
    const serverId = currentServer();
    if (serverId) {
      loadChannels(serverId);
      loadMembers(serverId);
      // Restore last channel for this server
      const memory = serverChannelMemory();
      const lastChannel = memory[serverId];
      if (lastChannel) {
        setCurrentChannel(lastChannel);
      }
    } else {
      // When switching to home, clear current channel and members
      setCurrentChannel('');
      setMembers([]);
    }
  });

  createEffect(() => {
    const channelId = currentChannel();
    if (channelId) {
      loadMessages(channelId);
    }
  });

  onMount(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      navigate('/');
      return;
    }

    setUser(JSON.parse(userStr));
    loadUser();
    loadServers();
    loadFriends();

    // Connect WebSocket
    const websocket = new WebSocket(WS_URL);

    websocket.onopen = () => {
      console.log('WebSocket connected');
      websocket.send(JSON.stringify({ type: 'Authenticate', token }));
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'Message') {
        setMessages([...messages(), data.message]);
      } else if (data.type === 'MessageDeleted') {
        setMessages(messages().filter(m => m._id !== data.messageId));
      } else if (data.type === 'Typing') {
        const channelTypers = typingUsers().get(data.channel) || new Set();
        channelTypers.add(data.username);
        const newMap = new Map(typingUsers());
        newMap.set(data.channel, channelTypers);
        setTypingUsers(newMap);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
          const channelTypers = typingUsers().get(data.channel);
          if (channelTypers) {
            channelTypers.delete(data.username);
            const newMap = new Map(typingUsers());
            newMap.set(data.channel, channelTypers);
            setTypingUsers(newMap);
          }
        }, 5000);
      } else if (data.type === 'StopTyping') {
        const channelTypers = typingUsers().get(data.channel);
        if (channelTypers) {
          channelTypers.delete(data.username);
          const newMap = new Map(typingUsers());
          newMap.set(data.channel, channelTypers);
          setTypingUsers(newMap);
        }
      }
    };

    websocket.onclose = () => {
      console.log('WebSocket disconnected');
    };

    setWs(websocket);

    // Cleanup
    return () => {
      websocket.close();
    };
  });

  const currentTypers = () => {
    const channel = currentChannel();
    if (!channel) return [];
    const typers = typingUsers().get(channel);
    return typers ? Array.from(typers) : [];
  };

  const typingText = () => {
    const typers = currentTypers();
    if (typers.length === 0) return '';
    if (typers.length === 1) return `${typers[0]} is typing...`;
    if (typers.length === 2) return `${typers[0]} and ${typers[1]} are typing...`;
    if (typers.length === 3) return `${typers[0]}, ${typers[1]}, and ${typers[2]} are typing...`;
    return 'Multiple users are typing...';
  };

  const handleChannelSelect = (channelId: string) => {
    setCurrentChannel(channelId);
    // Save channel selection to memory for current server
    const serverId = currentServer();
    if (serverId) {
      setServerChannelMemory({ ...serverChannelMemory(), [serverId]: channelId });
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div class="chat-container">
      <ServerList
        servers={servers()}
        currentServer={currentServer()}
        onServerSelect={(serverId) => setCurrentServer(serverId)}
        onCreateServer={() => setShowCreateServer(true)}
      />
      
      <div class="sidebar">
        <ChannelList
          channels={channels()}
          currentChannel={currentChannel()}
          currentServer={currentServer()}
          serverName={servers().find(s => s._id === currentServer())?.name}
          onChannelSelect={handleChannelSelect}
          onCreateChannel={() => setShowCreateChannel(true)}
          onServerSettings={() => setShowServerSettings(true)}
        />
        
        <UserPanel
          user={user()}
          onSettingsClick={() => setShowUserSettings(true)}
          onLogout={logout}
        />
      </div>
      
      <Show when={!currentServer()} fallback={
        <>
          <ChatArea
            messages={messages()}
            currentChannel={currentChannel()}
            messageInput={messageInput()}
            onMessageInputChange={setMessageInput}
            onSendMessage={sendMessage}
            onDeleteMessage={deleteMessage}
            onTyping={handleTyping}
            user={user()}
            typingText={typingText}
            lightboxImage={lightboxImage}
            onLightboxClose={() => setLightboxImage(null)}
            onImageClick={(url) => setLightboxImage(url)}
            pendingAttachments={pendingAttachments()}
            onRemoveAttachment={removePendingAttachment}
            onClearAttachments={() => setPendingAttachments([])}
            uploadingAttachment={uploadingAttachment()}
            onAttachmentUpload={handleAttachmentUpload}
            fileInputRef={fileInputRef}
          />
          <MembersList
            members={members()}
            onMemberClick={loadUserProfile}
          />
        </>
      }>
        <FriendsList
          friends={friends()}
          onUserProfileClick={loadUserProfile}
          onRefresh={loadFriends}
        />
      </Show>
      
      <Show when={showCreateServer()}>
        <CreateServerModal
          onClose={() => setShowCreateServer(false)}
          onCreate={createServer}
        />
      </Show>
      
      <Show when={showUserSettings()}>
        <UserSettingsModal
          user={user()}
          onClose={() => setShowUserSettings(false)}
          onUpdate={updateUserProfile}
        />
      </Show>
      
      <Show when={showServerSettings() && currentServer()}>
        <ServerSettingsModal
          server={servers().find(s => s._id === currentServer())}
          onClose={() => setShowServerSettings(false)}
          onUpdate={(updates) => updateServer(currentServer(), updates)}
        />
      </Show>
      
      <Show when={showCreateChannel()}>
        <CreateChannelModal
          serverId={currentServer()}
          categories={channels().filter(c => c.channelType === 'category')}
          onClose={() => setShowCreateChannel(false)}
          onCreate={createChannel}
        />
      </Show>
      
      <Show when={showUserProfile()}>
        <UserProfileModal
          user={showUserProfile()}
          currentUser={user()}
          onClose={() => setShowUserProfile(null)}
          onRefresh={loadFriends}
        />
      </Show>
    </div>
  );
};
