import { Component, For, Show, createMemo, createSignal } from 'solid-js';
import { Channel } from '../types';

interface ChannelListProps {
  channels: Channel[];
  dmChannels?: any[];
  currentChannel: string;
  currentServer: string;
  serverName?: string;
  onChannelSelect: (channelId: string) => void;
  onCreateChannel: () => void;
  onServerSettings: () => void;
  onEditChannel?: (channel: Channel) => void;
}

export const ChannelList: Component<ChannelListProps> = (props) => {
  const [contextMenu, setContextMenu] = createSignal<{ x: number; y: number; channel: Channel } | null>(null);

  const handleContextMenu = (e: MouseEvent, channel: Channel) => {
    e.preventDefault();
    if (props.onEditChannel) {
      setContextMenu({ x: e.clientX, y: e.clientY, channel });
    }
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  // Organize channels by category
  const organizedChannels = createMemo(() => {
    const categories = props.channels.filter(c => c.channelType === 'Category');
    const uncategorized = props.channels.filter(c => c.channelType !== 'Category' && !c.category);
    
    return {
      categories: categories.map(cat => ({
        ...cat,
        channels: props.channels.filter(ch => ch.category === cat._id && ch.channelType !== 'Category')
      })),
      uncategorized
    };
  });

  return (
    <div class="channel-list">
      <Show when={props.currentServer}>
        <div class="server-header" onClick={props.onServerSettings}>
          <span>{props.serverName || 'Server'}</span>
          <span class="settings-icon">⚙️</span>
        </div>
      </Show>
      
      <div class="channels-section">
        <div class="section-header">
          <span>{props.currentServer ? 'TEXT CHANNELS' : 'DIRECT MESSAGES'}</span>
          <Show when={props.currentServer}>
            <button class="add-channel" onClick={props.onCreateChannel}>
              +
            </button>
          </Show>
        </div>
        
        <Show when={props.currentServer}>
          {/* Categories with nested channels */}
          <For each={organizedChannels().categories}>
            {(category) => (
              <div class="channel-category-group">
                <div class="category-header">
                  <span class="category-arrow">▼</span>
                  <span class="category-name">{category.name}</span>
                </div>
                <For each={category.channels}>
                  {(channel) => (
                    <button
                      class="channel-item channel-nested"
                      classList={{ active: props.currentChannel === channel._id }}
                      onClick={() => props.onChannelSelect(channel._id)}
                      onContextMenu={(e) => handleContextMenu(e, channel)}
                  >
                    # {channel.name}
                  </button>
                )}
              </For>
            </div>
          )}
        </For>
        
        {/* Uncategorized channels */}
        <For each={organizedChannels().uncategorized}>
          {(channel) => (
            <button
              class="channel-item"
              classList={{ active: props.currentChannel === channel._id }}
              onClick={() => props.onChannelSelect(channel._id)}
              onContextMenu={(e) => handleContextMenu(e, channel)}
            >
              # {channel.name}
            </button>
          )}
        </For>
        </Show>
        
        {/* DM Channels when on home */}
        <Show when={!props.currentServer && props.dmChannels}>
          <For each={props.dmChannels}>
            {(dmChannel) => (
              <button
                class="channel-item"
                classList={{ active: props.currentChannel === dmChannel._id }}
                onClick={() => props.onChannelSelect(dmChannel._id)}
              >
                @ {dmChannel.recipient?.displayName || dmChannel.recipient?.username || 'Unknown User'}
              </button>
            )}
          </For>
        </Show>
      </div>
      
      {/* Context Menu */}
      <Show when={contextMenu()}>
        <div 
          class="context-menu-overlay" 
          onClick={handleCloseContextMenu}
        >
          <div 
            class="context-menu" 
            style={{ left: `${contextMenu()!.x}px`, top: `${contextMenu()!.y}px` }}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              class="context-menu-item"
              onClick={() => {
                if (props.onEditChannel) {
                  props.onEditChannel(contextMenu()!.channel);
                }
                handleCloseContextMenu();
              }}
            >
              ✏️ Edit Channel
            </button>
          </div>
        </div>
      </Show>
    </div>
  );
};
