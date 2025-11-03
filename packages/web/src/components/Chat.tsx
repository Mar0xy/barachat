import { Component, Show, onMount, createEffect, createMemo } from 'solid-js';
import { AddServerModal } from './modals/AddServerModal';
import { UserSettingsModal } from './modals/UserSettingsModal';
import { ServerSettingsModal } from './modals/ServerSettingsModal';
import { CreateChannelModal } from './modals/CreateChannelModal';
import { EditChannelModal } from './modals/EditChannelModal';
import { UserProfileModal } from './modals/UserProfileModal';
import { FriendsList } from './FriendsList';
import { MembersList } from './MembersList';
import { ServerList } from './ServerList';
import { ChannelList } from './ChannelList';
import { ChatArea } from './ChatArea';
import { UserPanel } from './UserPanel';
import { API_URL } from '../utils/constants';
import { useChatState } from '../hooks/useChatState';
import { connectWebSocket } from '../hooks/useWebSocket';

export const Chat: Component = () => {
  const state = useChatState();

  // Effects
  createEffect(() => {
    const serverId = state.currentServer();
    if (serverId) {
      state.loadChannels(serverId);
      state.loadMembers(serverId);
    } else {
      state.loadDMChannels();
      state.setMembers([]);
    }
  });

  createEffect(() => {
    const channelId = state.currentChannel();
    if (channelId) {
      state.loadMessages(channelId);
    }
  });

  onMount(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      state.navigate('/');
      return;
    }

    state.setUser(JSON.parse(userStr));
    state.loadUser();
    state.loadServers();
    state.loadFriends();
    state.loadDMChannels();

    // Connect WebSocket with handlers
    const websocket = connectWebSocket(token, {
      onMessage: (message, channel) => {
        if (channel === state.currentChannel()) {
          state.setMessages(prev => {
            if (prev.some(m => m._id === message._id)) return prev;
            return [...prev, message];
          });
        }
      },
      onMessageDelete: (messageId) => {
        state.setMessages(state.messages().filter(m => m._id !== messageId));
      },
      onUserUpdate: (userId, data) => {
        const currentUser = state.user();
        if (currentUser && currentUser._id === userId) {
          state.setUser({ ...currentUser, ...data });
        }
        state.setMembers(state.members().map(m => 
          m._id.user === userId ? { ...m, user: { ...m.user, ...data } } : m
        ));
        state.setFriends(state.friends().map(f => f._id === userId ? { ...f, ...data } : f));
        state.setDmChannels(state.dmChannels().map(dm =>
          dm.recipient?._id === userId ? { ...dm, recipient: { ...dm.recipient, ...data } } : dm
        ));
        const profileUser = state.showUserProfile();
        if (profileUser && profileUser._id === userId) {
          state.setShowUserProfile({ ...profileUser, ...data });
        }
      },
      onTyping: (channel, username) => {
        const channelTypers = state.typingUsers().get(channel) || new Set();
        channelTypers.add(username);
        const newMap = new Map(state.typingUsers());
        newMap.set(channel, channelTypers);
        state.setTypingUsers(newMap);
        setTimeout(() => {
          const typers = state.typingUsers().get(channel);
          if (typers) {
            typers.delete(username);
            const map = new Map(state.typingUsers());
            map.set(channel, typers);
            state.setTypingUsers(map);
          }
        }, 5000);
      },
      onStopTyping: (channel, username) => {
        const channelTypers = state.typingUsers().get(channel);
        if (channelTypers) {
          channelTypers.delete(username);
          const newMap = new Map(state.typingUsers());
          newMap.set(channel, channelTypers);
          state.setTypingUsers(newMap);
        }
      },
      onServerDelete: (serverId) => {
        state.setServers(state.servers().filter(s => s._id !== serverId));
        if (state.currentServer() === serverId) {
          state.setCurrentServer('');
          state.setCurrentChannel('');
        }
      },
      onServerMemberJoin: (serverId) => {
        if (state.currentServer() === serverId) {
          state.loadMembers(serverId);
        }
      },
      onServerMemberLeave: (serverId) => {
        if (state.currentServer() === serverId) {
          state.loadMembers(serverId);
        }
      },
      onChannelCreate: (channel, serverId) => {
        if (serverId === state.currentServer()) {
          if (!state.channels().some(c => c._id === channel._id)) {
            state.setChannels([...state.channels(), channel]);
          }
        }
      },
      onChannelUpdate: (channelId, data) => {
        state.setChannels(state.channels().map(c => c._id === channelId ? { ...c, ...data } : c));
      },
      onChannelDelete: (channelId) => {
        state.setChannels(state.channels().filter(c => c._id !== channelId));
        if (state.currentChannel() === channelId) {
          state.setCurrentChannel('');
        }
      },
      onUserRelationship: () => {
        state.loadFriends();
        state.loadDMChannels();
      }
    });

    state.setWs(websocket);

    return () => {
      websocket.close();
    };
  });

  const currentTypers = () => {
    const channel = state.currentChannel();
    if (!channel) return [];
    const typers = state.typingUsers().get(channel);
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

  const isCurrentServerOwner = createMemo(() => {
    const serverId = state.currentServer();
    if (!serverId) return false;
    const server = state.servers().find(s => s._id === serverId);
    return server?.owner === state.user()?._id;
  });

  const messagePlaceholder = createMemo(() => {
    const channel = state.currentChannel();
    if (!channel) return 'Message';
    const dmChannel = state.dmChannels().find(dm => dm._id === channel);
    if (dmChannel?.recipient) {
      return `Message ${dmChannel.recipient.displayName || dmChannel.recipient.username}`;
    }
    const serverChannel = state.channels().find(c => c._id === channel);
    if (serverChannel?.name) {
      return `Message #${serverChannel.name}`;
    }
    return 'Message #general';
  });

  const logout = async () => {
    const token = localStorage.getItem('token');
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
    state.navigate('/');
  };

  let fileInputRef: HTMLInputElement | undefined;

  return (
    <div class="chat-container">
      <ServerList
        servers={state.servers()}
        currentServer={state.currentServer()}
        onServerSelect={state.setCurrentServer}
        onCreateServer={() => state.setShowCreateServer(true)}
      />

      <Show
        when={state.currentServer()}
        fallback={
          <FriendsList
            friends={state.friends()}
            dmChannels={state.dmChannels()}
            currentChannel={state.currentChannel()}
            onChannelSelect={state.handleChannelSelect}
            onUserClick={state.loadUserProfile}
            onCreateDM={state.createOrOpenDM}
          />
        }
      >
        <ChannelList
          channels={state.channels()}
          currentChannel={state.currentChannel()}
          onChannelSelect={state.handleChannelSelect}
          onServerSettings={() => state.setShowServerSettings(true)}
          onCreateChannel={() => state.setShowCreateChannel(true)}
          onEditChannel={state.setEditingChannel}
          onDeleteChannel={state.deleteChannel}
          dmChannels={state.dmChannels()}
        />
      </Show>

      <div class="main-content">
        <ChatArea
          messages={state.messages()}
          currentChannel={state.currentChannel()}
          messageInput={state.messageInput()}
          onMessageInputChange={state.setMessageInput}
          onSendMessage={state.sendMessage}
          onDeleteMessage={state.deleteMessage}
          onTyping={state.handleTyping}
          user={state.user()}
          typingText={typingText}
          lightboxImage={state.lightboxImage}
          onLightboxClose={() => state.setLightboxImage(null)}
          onImageClick={state.setLightboxImage}
          pendingAttachments={state.pendingAttachments()}
          onRemoveAttachment={state.removePendingAttachment}
          onClearAttachments={() => state.setPendingAttachments([])}
          uploadingAttachment={state.uploadingAttachment()}
          onAttachmentUpload={(files) => {
            if (files && files[0]) state.uploadAttachment(files[0]);
          }}
          fileInputRef={fileInputRef}
          messagePlaceholder={messagePlaceholder()}
          onUserClick={state.loadUserProfile}
          isServerOwner={isCurrentServerOwner()}
        />
        <Show when={state.currentServer()}>
          <MembersList
            members={state.members()}
            onUserClick={state.loadUserProfile}
          />
        </Show>
      </div>

      <UserPanel
        user={state.user()}
        onSettings={() => state.setShowUserSettings(true)}
      />

      <Show when={state.showCreateServer()}>
        <AddServerModal
          onClose={() => state.setShowCreateServer(false)}
          onCreateServer={state.createServer}
          onJoinServer={state.joinServer}
        />
      </Show>

      <Show when={state.showUserSettings()}>
        <UserSettingsModal
          user={state.user()}
          onClose={() => state.setShowUserSettings(false)}
          onUpdate={state.setUser}
          onLogout={logout}
        />
      </Show>

      <Show when={state.showServerSettings()}>
        <ServerSettingsModal
          server={state.servers().find(s => s._id === state.currentServer())}
          isOwner={isCurrentServerOwner()}
          currentUserId={state.user()?._id}
          onClose={() => state.setShowServerSettings(false)}
          onUpdate={(server) => {
            state.setServers(state.servers().map(s => s._id === server._id ? server : s));
          }}
          onLeave={() => {
            state.setServers(state.servers().filter(s => s._id !== state.currentServer()));
            state.setCurrentServer('');
          }}
        />
      </Show>

      <Show when={state.showCreateChannel()}>
        <CreateChannelModal
          serverId={state.currentServer()}
          onClose={() => state.setShowCreateChannel(false)}
          onCreate={state.createChannel}
        />
      </Show>

      <Show when={state.editingChannel()}>
        <EditChannelModal
          channel={state.editingChannel()!}
          onClose={() => state.setEditingChannel(null)}
          onUpdate={state.updateChannel}
        />
      </Show>

      <Show when={state.showUserProfile()}>
        <UserProfileModal
          user={state.showUserProfile()!}
          currentUser={state.user()}
          onClose={() => state.setShowUserProfile(null)}
          onMessage={state.createOrOpenDM}
        />
      </Show>

      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept="image/*,video/*"
        onChange={(e) => {
          const files = e.currentTarget.files;
          if (files && files[0]) state.uploadAttachment(files[0]);
        }}
      />
    </div>
  );
};
