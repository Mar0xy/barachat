import { Component, Show } from 'solid-js';
import { User } from '../types';

interface UserPanelProps {
  user: User | null;
  onSettingsClick: () => void;
  onLogout: () => void;
}

export const UserPanel: Component<UserPanelProps> = (props) => {
  return (
    <div class="user-panel">
      <div class="user-info">
        <div class="user-avatar">
          <Show when={props.user?.avatar} fallback={
            <div class="avatar-placeholder">
              {(props.user?.displayName || props.user?.username || 'U').charAt(0).toUpperCase()}
            </div>
          }>
            <img src={props.user!.avatar} alt={props.user!.username} />
          </Show>
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
        <button onClick={props.onLogout} title="Logout">
          🚪
        </button>
      </div>
    </div>
  );
};
