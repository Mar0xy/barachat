import { Component, For, Show } from 'solid-js';
import { Channel } from '../types';

interface ChannelListProps {
  channels: Channel[];
  currentChannel: string;
  currentServer: string;
  onChannelSelect: (channelId: string) => void;
  onCreateChannel: () => void;
  onServerSettings: () => void;
}

export const ChannelList: Component<ChannelListProps> = (props) => {
  return (
    <div class="channel-list">
      <Show when={props.currentServer}>
        <div class="server-header" onClick={props.onServerSettings}>
          <span>Server Name</span>
          <span class="settings-icon">⚙️</span>
        </div>
      </Show>
      
      <div class="channels-section">
        <div class="section-header">
          <span>TEXT CHANNELS</span>
          <button class="add-channel" onClick={props.onCreateChannel}>
            +
          </button>
        </div>
        
        <For each={props.channels.filter(c => c.channelType === 'text')}>
          {(channel) => (
            <button
              class="channel-item"
              classList={{ active: props.currentChannel === channel._id }}
              onClick={() => props.onChannelSelect(channel._id)}
            >
              # {channel.name}
            </button>
          )}
        </For>
      </div>
    </div>
  );
};
