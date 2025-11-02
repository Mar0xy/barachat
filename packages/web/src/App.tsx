import { Component, createSignal, Show, onMount, For, createEffect } from 'solid-js';
import { Route, Routes, useNavigate } from '@solidjs/router';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';

interface User {
  _id: string;
  username: string;
  discriminator: string;
}

interface Channel {
  _id: string;
  channelType: string;
  name?: string;
  recipients?: string[];
}

interface Message {
  _id: string;
  author: string;
  content: string;
  channel: string;
}

const Login: Component = () => {
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

const Chat: Component = () => {
  const [user, setUser] = createSignal<User | null>(null);
  const [channels, setChannels] = createSignal<Channel[]>([]);
  const [currentChannel, setCurrentChannel] = createSignal<string>('');
  const [messages, setMessages] = createSignal<Message[]>([]);
  const [messageInput, setMessageInput] = createSignal('');
  const [ws, setWs] = createSignal<WebSocket | null>(null);
  const navigate = useNavigate();

  onMount(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      navigate('/');
      return;
    }

    setUser(JSON.parse(userStr));

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
        setChannels(data.channels || []);
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
        setMessageInput('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div class="app">
      <div class="sidebar">
        <div style={{ padding: '16px', 'border-bottom': '1px solid #2a2a2a' }}>
          <strong>{user()?.username}#{user()?.discriminator}</strong>
        </div>
        <div class="channel-list">
          <For each={channels()}>
            {(channel) => (
              <div
                class={`channel-item ${currentChannel() === channel._id ? 'active' : ''}`}
                onClick={() => setCurrentChannel(channel._id)}
              >
                # {channel.name || 'Channel'}
              </div>
            )}
          </For>
        </div>
      </div>
      <div class="main-content">
        <div class="chat-header">
          <Show when={currentChannel()}>
            <strong>
              # {channels().find(c => c._id === currentChannel())?.name || 'Channel'}
            </strong>
          </Show>
        </div>
        <div class="messages">
          <For each={messages()}>
            {(message) => (
              <div class="message">
                <div class="message-author">{message.author}</div>
                <div class="message-content">{message.content}</div>
              </div>
            )}
          </For>
        </div>
        <div class="message-input">
          <form onSubmit={sendMessage}>
            <input
              type="text"
              placeholder="Send a message..."
              value={messageInput()}
              onInput={(e) => setMessageInput(e.currentTarget.value)}
            />
          </form>
        </div>
      </div>
    </div>
  );
};

const App: Component = () => {
  return (
    <Routes>
      <Route path="/" component={Login} />
      <Route path="/app" component={Chat} />
    </Routes>
  );
};

export default App;
