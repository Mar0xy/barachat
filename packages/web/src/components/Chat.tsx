import { Component, createSignal, Show, onMount, createEffect, createMemo } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { AddServerModal } from './modals/AddServerModal';
import { UserSettingsModal } from './modals/UserSettingsModal';
import { ServerSettingsModal } from './modals/ServerSettingsModal';
import { CreateChannelModal } from './modals/CreateChannelModal';
import { EditChannelModal } from './modals/EditChannelModal';
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
  const [editingChannel, setEditingChannel] = createSignal<Channel | null>(null);
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
  const [dmChannels, setDmChannels] = createSignal<any[]>([]);
  
  let fileInputRef: HTMLInputElement | undefined;
  const navigate = useNavigate();

  // Create or open DM channel
  const createOrOpenDM = async (userId: string) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/channels/create-dm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ userId })
      });

      if (response.ok) {
        const dmChannel = await response.json();
        // Switch to home (no server) and select the DM channel
        setCurrentServer('');
        setCurrentChannel(dmChannel._id);
        // Reload DM channels to include the new one
        await loadDMChannels();
        // Load messages for the DM
        loadMessages(dmChannel._id);
        // Close any open modals
        setShowUserProfile(null);
      }
    } catch (error) {
      console.error('Error creating DM:', error);
    }
  };

  // Load user data
  const loadUser = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/users/@me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const userData = await response.json();
        // Set default status if not set
        if (!userData.status) {
          userData.status = { presence: 'Online', text: '' };
        }
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
        console.log('Servers loaded:', serverList);
        // Normalize server names to ensure they're strings
        const normalizedServers = serverList.map((server: Server) => ({
          ...server,
          name: typeof server.name === 'string' ? server.name : String(server.name || 'Unnamed Server')
        }));
        setServers(normalizedServers);
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

  // Load DM channels
  const loadDMChannels = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/channels/dms/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const dmList = await response.json();
        setDmChannels(dmList);
      }
    } catch (error) {
      console.error('Error loading DM channels:', error);
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
        const message = await response.json();
        // Immediately add the message to the list
        setMessages([...messages(), message]);
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
        console.log('Server created:', server);
        // Ensure name is a string
        const normalizedServer = {
          ...server,
          name: typeof server.name === 'string' ? server.name : String(server.name || 'Unnamed Server')
        };
        setServers([...servers(), normalizedServer]);
        setShowCreateServer(false);
        setCurrentServer(server._id);
      }
    } catch (error) {
      console.error('Error creating server:', error);
    }
  };

  // Join server (via invite)
  const joinServer = async (server: Server) => {
    // Normalize server name
    const normalizedServer = {
      ...server,
      name: typeof server.name === 'string' ? server.name : String(server.name || 'Unnamed Server')
    };
    
    // Check if server already exists in the list
    if (!servers().some(s => s._id === server._id)) {
      setServers([...servers(), normalizedServer]);
    }
    
    setShowCreateServer(false);
    setCurrentServer(server._id);
  };

  // Create channel
  const createChannel = (channel: Channel) => {
    setChannels([...channels(), channel]);
    setShowCreateChannel(false);
  };

  // Update channel
  const updateChannel = async (channelId: string, name: string, category?: string) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/channels/${channelId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name, category: category || null })
      });

      if (response.ok) {
        const updatedChannel = await response.json();
        setChannels(channels().map(c => c._id === channelId ? updatedChannel : c));
        setEditingChannel(null);
      }
    } catch (error) {
      console.error('Error updating channel:', error);
    }
  };

  // Delete channel
  const deleteChannel = async (channelId: string) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/channels/${channelId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        setChannels(channels().filter(c => c._id !== channelId));
        if (currentChannel() === channelId) {
          setCurrentChannel('');
        }
        setEditingChannel(null);
      }
    } catch (error) {
      console.error('Error deleting channel:', error);
    }
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
      // When switching to home, load DM channels and clear members
      loadDMChannels();
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
    loadDMChannels();

    // Connect WebSocket
    const websocket = new WebSocket(WS_URL);

    websocket.onopen = () => {
      console.log('WebSocket connected');
      websocket.send(JSON.stringify({ type: 'Authenticate', token }));
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'Message') {
        // Add message if it's for the current channel and not already in the list
        if (data.message.channel === currentChannel()) {
          setMessages(prev => {
            // Check if message already exists
            if (prev.some(m => m._id === data.message._id)) {
              return prev;
            }
            return [...prev, data.message];
          });
        }
      } else if (data.type === 'MessageDelete') {
        setMessages(messages().filter(m => m._id !== data.id));
      } else if (data.type === 'UserUpdate') {
        // Update user info when it changes
        if (data.id && data.data) {
          // Update current user if it's them
          const currentUser = user();
          if (currentUser && currentUser._id === data.id) {
            setUser({ ...currentUser, ...data.data });
          }
          
          // Update members list (members have nested user objects)
          setMembers(members().map(m => {
            if (m._id.user === data.id) {
              return { ...m, user: { ...m.user, ...data.data } };
            }
            return m;
          }));
          
          // Update friends list
          setFriends(friends().map(f => 
            f._id === data.id 
              ? { ...f, ...data.data } 
              : f
          ));
          
          // Update DM channels recipient info
          setDmChannels(dmChannels().map(dm => {
            if (dm.recipient && dm.recipient._id === data.id) {
              return { ...dm, recipient: { ...dm.recipient, ...data.data } };
            }
            return dm;
          }));
          
          // Update user profile modal if it's open for this user
          const profileUser = showUserProfile();
          if (profileUser && profileUser._id === data.id) {
            setShowUserProfile({ ...profileUser, ...data.data });
          }
        }
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
      } else if (data.type === 'ServerDelete') {
        // Remove server from list when deleted
        setServers(servers().filter(s => s._id !== data.id));
        
        // If we're currently viewing the deleted server, switch to home
        if (currentServer() === data.id) {
          setCurrentServer('');
          setCurrentChannel('');
        }
      } else if (data.type === 'ServerMemberJoin') {
        // Reload members if we're viewing the server where someone joined
        if (currentServer() === data.serverId) {
          loadMembers(data.serverId);
        }
      } else if (data.type === 'ServerMemberLeave') {
        // Reload members if we're viewing the server where someone left
        if (currentServer() === data.serverId) {
          loadMembers(data.serverId);
        }
      } else if (data.type === 'ChannelCreate') {
        // Add new channel to the list if it's for the current server
        if (data.channel && data.channel.server === currentServer()) {
          setChannels([...channels(), data.channel]);
        }
      } else if (data.type === 'ChannelUpdate') {
        // Update channel in the list
        setChannels(channels().map(c => 
          c._id === data.id ? { ...c, ...data.data } : c
        ));
      } else if (data.type === 'ChannelDelete') {
        // Remove channel from list
        setChannels(channels().filter(c => c._id !== data.id));
        
        // If we're currently viewing the deleted channel, clear it
        if (currentChannel() === data.id) {
          setCurrentChannel('');
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

  // Calculate message placeholder based on current channel
  const messagePlaceholder = createMemo(() => {
    const channel = currentChannel();
    if (!channel) return 'Message';
    
    // Check if it's a DM channel
    const dmChannel = dmChannels().find(dm => dm._id === channel);
    if (dmChannel && dmChannel.recipient) {
      const recipientName = dmChannel.recipient.displayName || dmChannel.recipient.username;
      return `Message ${recipientName}`;
    }
    
    // Check if it's a server channel
    const serverChannel = channels().find(c => c._id === channel);
    if (serverChannel && serverChannel.name) {
      return `Message #${serverChannel.name}`;
    }
    
    return 'Message #general';
  });

  const logout = async () => {
    const token = localStorage.getItem('token');
    
    // Call logout endpoint to set presence to offline
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Error during logout:', error);
    }
    
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
        onHomeClick={() => setCurrentChannel('')}
      />
      
      <div class="sidebar">
        <ChannelList
          channels={currentServer() ? channels() : []}
          dmChannels={dmChannels()}
          currentChannel={currentChannel()}
          currentServer={currentServer()}
          serverName={servers().find(s => s._id === currentServer())?.name}
          onChannelSelect={handleChannelSelect}
          onCreateChannel={() => setShowCreateChannel(true)}
          onServerSettings={() => setShowServerSettings(true)}
          onEditChannel={(channel) => setEditingChannel(channel)}
        />
        
        <UserPanel
          user={user()}
          onSettingsClick={() => setShowUserSettings(true)}
          onLogout={logout}
        />
      </div>
      
      <Show when={!currentServer() && !currentChannel()} fallback={
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
            messagePlaceholder={messagePlaceholder()}
          />
          <Show when={currentServer()}>
            <MembersList
              members={members()}
              onMemberClick={loadUserProfile}
            />
          </Show>
        </>
      }>
        <FriendsList
          friends={friends()}
          onUserProfileClick={loadUserProfile}
          onRefresh={loadFriends}
          onSendDM={createOrOpenDM}
        />
      </Show>
      
      <Show when={showCreateServer()}>
        <AddServerModal
          onClose={() => setShowCreateServer(false)}
          onCreate={createServer}
          onJoin={joinServer}
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
          onUpdate={(updatedServer) => {
            // Normalize server name
            const normalizedServer = {
              ...updatedServer,
              name: typeof updatedServer.name === 'string' ? updatedServer.name : String(updatedServer.name || 'Unnamed Server')
            };
            setServers(servers().map(s => s._id === normalizedServer._id ? normalizedServer : s));
          }}
          onLeave={() => {
            // Remove server from list and switch to home
            setServers(servers().filter(s => s._id !== currentServer()));
            setCurrentServer('');
            setCurrentChannel('');
          }}
        />
      </Show>
      
      <Show when={showCreateChannel()}>
        <CreateChannelModal
          serverId={currentServer()}
          categories={channels().filter(c => c.channelType === 'Category')}
          onClose={() => setShowCreateChannel(false)}
          onCreate={createChannel}
        />
      </Show>
      
      <Show when={editingChannel()}>
        <EditChannelModal
          channel={editingChannel()!}
          categories={channels().filter(c => c.channelType === 'Category')}
          onClose={() => setEditingChannel(null)}
          onUpdate={updateChannel}
          onDelete={deleteChannel}
        />
      </Show>
      
      <Show when={showUserProfile()}>
        <UserProfileModal
          user={showUserProfile()}
          currentUser={user()}
          friends={friends()}
          onClose={() => setShowUserProfile(null)}
          onRefresh={loadFriends}
          onSendDM={createOrOpenDM}
        />
      </Show>
    </div>
  );
};
