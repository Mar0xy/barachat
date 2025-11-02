import { Component, Show } from 'solid-js';
import { User } from '../types';

interface UserPanelProps {
  user: User | null;
  onSettingsClick: () => void;
}

export const UserPanel: Component<UserPanelProps> = (props) => {
  const getPresenceClass = () => {
    if (!props.user?.status?.presence || props.user.status.presence === 'Invisible') {
      return 'offline';
    }
    
    switch (props.user.status.presence) {
      case 'Online':
        return 'online';
      case 'Idle':
        return 'idle';
      case 'Busy':
        return 'dnd';
      default:
        return 'offline';
    }
  };

  return (
    <div class="user-panel">
      <div class="user-info">
        <div class="user-avatar-wrapper">
          <div class="user-avatar">
            <Show when={props.user?.avatar} fallback={
              <div class="avatar-placeholder">
                {(props.user?.displayName || props.user?.username || 'U').charAt(0).toUpperCase()}
              </div>
            }>
              <img src={props.user!.avatar} alt={props.user!.username} />
            </Show>
          </div>
          <div class={`user-status-indicator ${getPresenceClass()}`} />
        </div>
        <div class="user-details">
          <div class="user-name">{props.user?.displayName || props.user?.username}</div>
          <div class="user-discriminator">#{props.user?.discriminator}</div>
        </div>
      </div>
      <div class="user-actions">
        <button onClick={props.onSettingsClick} title="User Settings">
          ⚙️
        </button>
      </div>
    </div>
  );
};
