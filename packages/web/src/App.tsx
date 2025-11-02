import { Component, createSignal, Show, onMount, For, createEffect, batch } from 'solid-js';
import { useNavigate } from '@solidjs/router';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';

interface User {
  _id: string;
  username: string;
  discriminator: string;
  displayName?: string;
  avatar?: string;
}

interface Server {
  _id: string;
  name: string;
  description?: string;
  owner: string;
  channels: string[];
  icon?: string;
}

interface Channel {
  _id: string;
  channelType: string;
  name?: string;
  recipients?: string[];
  server?: string;
}

interface Message {
  _id: string;
  author: string;
  content: string;
  channel: string;
}

export const Login: Component = () => {
  const [isRegister, setIsRegister] = createSignal(false);
  const [email, setEmail] = createSignal('');
  const [username, setUsername] = createSignal('');
  const [password, setPassword] = createSignal('');
  const navigate = useNavigate();

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    const endpoint = isRegister() ? '/auth/register' : '/auth/login';
    const body = isRegister()
      ? { email: email(), username: username(), password: password() }
      : { email: email(), password: password() };

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/app');
      } else {
        alert(data.error || 'Authentication failed');
      }
    } catch (error) {
      console.error('Auth error:', error);
      alert('Failed to connect to server');
    }
  };

  return (
    <div class="login-container">
      <div class="login-box">
        <h1>{isRegister() ? 'Create Account' : 'Welcome Back'}</h1>
        <form onSubmit={handleSubmit}>
          <Show when={isRegister()}>
            <input
              type="text"
              placeholder="Username"
              value={username()}
              onInput={(e) => setUsername(e.currentTarget.value)}
              required
            />
          </Show>
          <input
            type="email"
            placeholder="Email"
            value={email()}
            onInput={(e) => setEmail(e.currentTarget.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password()}
            onInput={(e) => setPassword(e.currentTarget.value)}
            required
          />
          <button type="submit">
            {isRegister() ? 'Register' : 'Login'}
          </button>
        </form>
        <div class="switch">
          {isRegister() ? 'Already have an account?' : "Don't have an account?"}
          <button onClick={() => setIsRegister(!isRegister())}>
            {isRegister() ? 'Login' : 'Register'}
          </button>
        </div>
      </div>
    </div>
  );
};

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
  const navigate = useNavigate();

  // Fetch servers
  const loadServers = async () => {
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

  onMount(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      navigate('/');
      return;
    }

    setUser(JSON.parse(userStr));
    loadServers();

    // Connect WebSocket
    const websocket = new WebSocket(WS_URL);

    websocket.onopen = () => {
      console.log('WebSocket connected');
      websocket.send(JSON.stringify({ type: 'Authenticate', token }));
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('WS message:', data);

      if (data.type === 'Ready') {
        batch(() => {
          setServers(data.servers || []);
          setChannels(data.channels || []);
          if (data.servers && data.servers.length > 0) {
            setCurrentServer(data.servers[0]._id);
          }
        });
      } else if (data.type === 'Message') {
        if (data.message.channel === currentChannel()) {
          setMessages([...messages(), data.message]);
        }
      }
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    websocket.onclose = () => {
      console.log('WebSocket disconnected');
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  });

  createEffect(async () => {
    const channelId = currentChannel();
    if (!channelId) return;

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/channels/${channelId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  });

  const sendMessage = async (e: Event) => {
    e.preventDefault();
    if (!messageInput().trim() || !currentChannel()) return;

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/channels/${currentChannel()}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content: messageInput() })
      });

      if (response.ok) {
        const message = await response.json();
        setMessages([...messages(), message]);
        setMessageInput('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const serverChannels = () => channels().filter(c => c.server === currentServer());

  return (
    <div class="app">
      {/* Server List */}
      <div class="server-list">
        <button class="server-icon home-icon" onClick={() => setCurrentServer('')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z"/>
          </svg>
        </button>
        <div class="server-divider"></div>
        <For each={servers()}>
          {(server) => (
            <button
              class={`server-icon ${currentServer() === server._id ? 'active' : ''}`}
              onClick={() => setCurrentServer(server._id)}
              title={server.name}
            >
              {server.icon || server.name.substring(0, 2).toUpperCase()}
            </button>
          )}
        </For>
        <button class="server-icon add-server" onClick={() => setShowCreateServer(true)}>+</button>
      </div>

      {/* Channel Sidebar */}
      <div class="sidebar">
        <div class="server-header">
          <strong>{servers().find(s => s._id === currentServer())?.name || 'Direct Messages'}</strong>
          <Show when={currentServer()}>
            <button class="icon-button" onClick={() => setShowServerSettings(true)}>⚙</button>
          </Show>
        </div>
        <div class="channel-list">
          <div class="channel-category">
            <span>TEXT CHANNELS</span>
            <Show when={currentServer()}>
              <button 
                class="add-channel-button" 
                onClick={() => setShowCreateChannel(true)}
                title="Create Channel"
              >
                +
              </button>
            </Show>
          </div>
          <For each={serverChannels()}>
            {(channel) => (
              <div
                class={`channel-item ${currentChannel() === channel._id ? 'active' : ''}`}
                onClick={() => setCurrentChannel(channel._id)}
              >
                <span class="channel-hash">#</span>
                <span class="channel-name">{channel.name || 'channel'}</span>
              </div>
            )}
          </For>
        </div>
        <div class="user-panel">
          <div class="user-info">
            <div class="user-avatar">{user()?.username?.substring(0, 2).toUpperCase()}</div>
            <div class="user-details">
              <div class="user-name">{user()?.username}</div>
              <div class="user-tag">#{user()?.discriminator}</div>
            </div>
          </div>
          <button class="icon-button" onClick={() => setShowUserSettings(true)}>⚙</button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div class="main-content">
        <div class="chat-header">
          <Show when={currentChannel()}>
            <span class="channel-hash">#</span>
            <strong>{channels().find(c => c._id === currentChannel())?.name || 'channel'}</strong>
          </Show>
        </div>
        <div class="messages">
          <For each={messages()}>
            {(message) => (
              <div class="message">
                <div class="message-avatar">{message.author.substring(0, 2).toUpperCase()}</div>
                <div class="message-content-wrapper">
                  <div class="message-header">
                    <span class="message-author">{message.author}</span>
                    <span class="message-timestamp">{new Date().toLocaleTimeString()}</span>
                  </div>
                  <div class="message-content">{message.content}</div>
                </div>
              </div>
            )}
          </For>
        </div>
        <div class="message-input">
          <form onSubmit={sendMessage}>
            <input
              type="text"
              placeholder={`Message #${channels().find(c => c._id === currentChannel())?.name || 'channel'}`}
              value={messageInput()}
              onInput={(e) => setMessageInput(e.currentTarget.value)}
              disabled={!currentChannel()}
            />
          </form>
        </div>
      </div>

      {/* Create Server Modal */}
      <Show when={showCreateServer()}>
        <CreateServerModal
          onClose={() => setShowCreateServer(false)}
          onCreate={createServer}
        />
      </Show>

      {/* User Settings Modal */}
      <Show when={showUserSettings()}>
        <UserSettingsModal
          user={user()}
          onClose={() => setShowUserSettings(false)}
          onUpdate={(updatedUser) => {
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
          }}
        />
      </Show>

      {/* Server Settings Modal */}
      <Show when={showServerSettings()}>
        <ServerSettingsModal
          server={servers().find(s => s._id === currentServer())}
          onClose={() => setShowServerSettings(false)}
          onUpdate={(updatedServer) => {
            setServers(servers().map(s => s._id === updatedServer._id ? updatedServer : s));
          }}
        />
      </Show>

      {/* Create Channel Modal */}
      <Show when={showCreateChannel()}>
        <CreateChannelModal
          serverId={currentServer()}
          onClose={() => setShowCreateChannel(false)}
          onCreate={(channel) => {
            setChannels([...channels(), channel]);
          }}
        />
      </Show>
    </div>
  );
};

// Create Server Modal Component
const CreateServerModal: Component<{
  onClose: () => void;
  onCreate: (name: string, description: string) => void;
}> = (props) => {
  const [name, setName] = createSignal('');
  const [description, setDescription] = createSignal('');

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (name().trim()) {
      props.onCreate(name(), description());
      props.onClose();
    }
  };

  return (
    <div class="modal-overlay" onClick={props.onClose}>
      <div class="modal" onClick={(e) => e.stopPropagation()}>
        <div class="modal-header">
          <h2>Create Server</h2>
          <button class="modal-close" onClick={props.onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div class="modal-body">
            <label>
              Server Name
              <input
                type="text"
                value={name()}
                onInput={(e) => setName(e.currentTarget.value)}
                placeholder="My Awesome Server"
                required
              />
            </label>
            <label>
              Description (optional)
              <textarea
                value={description()}
                onInput={(e) => setDescription(e.currentTarget.value)}
                placeholder="A place for..."
                rows={3}
              />
            </label>
          </div>
          <div class="modal-footer">
            <button type="button" class="button-secondary" onClick={props.onClose}>Cancel</button>
            <button type="submit" class="button-primary">Create Server</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// User Settings Modal Component
const UserSettingsModal: Component<{
  user: User | null;
  onClose: () => void;
  onUpdate: (user: User) => void;
}> = (props) => {
  const [displayName, setDisplayName] = createSignal(props.user?.displayName || '');
  const [avatar, setAvatar] = createSignal(props.user?.avatar || '');
  const [saving, setSaving] = createSignal(false);
  const [uploading, setUploading] = createSignal(false);

  const handleFileUpload = async (e: Event) => {
    const input = e.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    setUploading(true);

    const formData = new FormData();
    formData.append('avatar', file);

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/upload/avatar`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setAvatar(API_URL + data.url);
      } else {
        alert('Failed to upload avatar');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Error uploading avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: Event) => {
    e.preventDefault();
    setSaving(true);

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/users/@me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          displayName: displayName(),
          avatar: avatar()
        })
      });

      if (response.ok) {
        const updatedUser = await response.json();
        props.onUpdate(updatedUser);
        props.onClose();
      }
    } catch (error) {
      console.error('Error updating user:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div class="modal-overlay" onClick={props.onClose}>
      <div class="modal" onClick={(e) => e.stopPropagation()}>
        <div class="modal-header">
          <h2>User Settings</h2>
          <button class="modal-close" onClick={props.onClose}>×</button>
        </div>
        <form onSubmit={handleSave}>
          <div class="modal-body">
            <div class="settings-section">
              <h3>My Account</h3>
              <label>
                Username
                <input type="text" value={props.user?.username || ''} disabled />
              </label>
              <label>
                Discriminator
                <input type="text" value={`#${props.user?.discriminator || '0000'}`} disabled />
              </label>
              <label>
                Display Name
                <input
                  type="text"
                  value={displayName()}
                  onInput={(e) => setDisplayName(e.currentTarget.value)}
                  placeholder="Enter a display name"
                />
              </label>
              <label>
                Avatar
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading()}
                />
                {uploading() && <p class="upload-status">Uploading...</p>}
              </label>
              <label>
                Avatar URL (or upload above)
                <input
                  type="text"
                  value={avatar()}
                  onInput={(e) => setAvatar(e.currentTarget.value)}
                  placeholder="Enter avatar image URL (e.g., https://...)"
                />
              </label>
              <Show when={avatar()}>
                <div class="avatar-preview">
                  <p>Avatar Preview:</p>
                  <img src={avatar()} alt="Avatar preview" class="preview-image" />
                </div>
              </Show>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="button-secondary" onClick={props.onClose}>Cancel</button>
            <button type="submit" class="button-primary" disabled={saving()}>
              {saving() ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Server Settings Modal Component
const ServerSettingsModal: Component<{
  server: Server | undefined;
  onClose: () => void;
  onUpdate: (server: Server) => void;
}> = (props) => {
  const [name, setName] = createSignal(props.server?.name || '');
  const [description, setDescription] = createSignal(props.server?.description || '');
  const [icon, setIcon] = createSignal(props.server?.icon || '');
  const [saving, setSaving] = createSignal(false);
  const [uploading, setUploading] = createSignal(false);

  const handleFileUpload = async (e: Event) => {
    const input = e.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    setUploading(true);

    const formData = new FormData();
    formData.append('icon', file);

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/upload/server-icon`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setIcon(API_URL + data.url);
      } else {
        alert('Failed to upload server icon');
      }
    } catch (error) {
      console.error('Error uploading server icon:', error);
      alert('Error uploading server icon');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: Event) => {
    e.preventDefault();
    if (!props.server) return;

    setSaving(true);
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`${API_URL}/servers/${props.server._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: name(),
          description: description(),
          icon: icon()
        })
      });

      if (response.ok) {
        const updatedServer = await response.json();
        props.onUpdate(updatedServer);
        props.onClose();
      }
    } catch (error) {
      console.error('Error updating server:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div class="modal-overlay" onClick={props.onClose}>
      <div class="modal" onClick={(e) => e.stopPropagation()}>
        <div class="modal-header">
          <h2>Server Settings</h2>
          <button class="modal-close" onClick={props.onClose}>×</button>
        </div>
        <form onSubmit={handleSave}>
          <div class="modal-body">
            <div class="settings-section">
              <h3>Overview</h3>
              <label>
                Server Name
                <input 
                  type="text" 
                  value={name()} 
                  onInput={(e) => setName(e.currentTarget.value)}
                  placeholder="Server Name"
                />
              </label>
              <label>
                Description
                <textarea
                  value={description()}
                  onInput={(e) => setDescription(e.currentTarget.value)}
                  placeholder="Server description"
                  rows={3}
                />
              </label>
              <label>
                Server Icon
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading()}
                />
                {uploading() && <p class="upload-status">Uploading...</p>}
              </label>
              <label>
                Server Icon URL (or upload above)
                <input
                  type="text"
                  value={icon()}
                  onInput={(e) => setIcon(e.currentTarget.value)}
                  placeholder="Enter icon image URL (e.g., https://...)"
                />
              </label>
              <Show when={icon()}>
                <div class="avatar-preview">
                  <p>Icon Preview:</p>
                  <img src={icon()} alt="Server icon preview" class="preview-image" />
                </div>
              </Show>
              <label>
                Server ID
                <input type="text" value={props.server?._id || ''} disabled />
              </label>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="button-secondary" onClick={props.onClose}>Cancel</button>
            <button type="submit" class="button-primary" disabled={saving()}>
              {saving() ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Create Channel Modal Component
const CreateChannelModal: Component<{
  serverId: string;
  onClose: () => void;
  onCreate: (channel: Channel) => void;
}> = (props) => {
  const [name, setName] = createSignal('');
  const [description, setDescription] = createSignal('');

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!name().trim() || !props.serverId) return;

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/servers/${props.serverId}/channels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: name(),
          description: description()
        })
      });

      if (response.ok) {
        const channel = await response.json();
        props.onCreate(channel);
        props.onClose();
      }
    } catch (error) {
      console.error('Error creating channel:', error);
    }
  };

  return (
    <div class="modal-overlay" onClick={props.onClose}>
      <div class="modal" onClick={(e) => e.stopPropagation()}>
        <div class="modal-header">
          <h2>Create Text Channel</h2>
          <button class="modal-close" onClick={props.onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div class="modal-body">
            <label>
              Channel Name
              <input
                type="text"
                value={name()}
                onInput={(e) => setName(e.currentTarget.value)}
                placeholder="general"
                required
              />
            </label>
            <label>
              Description (optional)
              <textarea
                value={description()}
                onInput={(e) => setDescription(e.currentTarget.value)}
                placeholder="Channel topic..."
                rows={3}
              />
            </label>
          </div>
          <div class="modal-footer">
            <button type="button" class="button-secondary" onClick={props.onClose}>Cancel</button>
            <button type="submit" class="button-primary">Create Channel</button>
          </div>
        </form>
      </div>
    </div>
  );
};
