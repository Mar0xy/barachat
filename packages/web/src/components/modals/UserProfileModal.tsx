import { Component, createSignal, Show } from 'solid-js';
import { User } from '../types';
import { API_URL } from '../utils/constants';

interface UserProfileModalProps {
  user: User | null;
  currentUser: User | null;
  onClose: () => void;
  onRefresh?: () => void;
}

export const UserProfileModal: Component<UserProfileModalProps> = (props) => {
  const [sending, setSending] = createSignal(false);

  const sendFriendRequest = async () => {
    if (!props.user) return;
    
    setSending(true);
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`${API_URL}/users/@me/relationships/${props.user._id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        alert('Friend request sent!');
        props.onRefresh?.();
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
    } finally {
      setSending(false);
    }
  };

  const sendDirectMessage = async () => {
    if (!props.user) return;
    
    // TODO: Create DM channel and navigate to it
    alert('Direct messaging will be implemented soon!');
  };

  const getPresenceText = () => {
    if (!props.user?.status?.presence) return 'Offline';
    
    switch (props.user.status.presence) {
      case 'Online':
        return 'Online';
      case 'Idle':
        return 'Idle';
      case 'Busy':
        return 'Do Not Disturb';
      case 'Invisible':
        return 'Offline';
      default:
        return 'Offline';
    }
  };

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

  const isCurrentUser = () => props.user?._id === props.currentUser?._id;

  return (
    <Show when={props.user}>
      <div class="modal-overlay" onClick={props.onClose}>
        <div class="modal user-profile-modal" onClick={(e) => e.stopPropagation()}>
          <div class="profile-banner">
            <button class="modal-close profile-close" onClick={props.onClose}>×</button>
          </div>
          
          <div class="profile-content">
            <div class="profile-avatar-section">
              <div class="profile-avatar-wrapper">
                {props.user!.avatar ? (
                  <img src={props.user!.avatar} alt={props.user!.username} class="profile-avatar-large" />
                ) : (
                  <div class="profile-avatar-large profile-avatar-placeholder">
                    {props.user!.username[0].toUpperCase()}
                  </div>
                )}
                <div class={`profile-status-indicator ${getPresenceClass()}`} />
              </div>
            </div>

            <div class="profile-info">
              <div class="profile-name-section">
                <h2 class="profile-display-name">
                  {props.user!.displayName || props.user!.username}
                </h2>
                <div class="profile-username-tag">
                  {props.user!.username}#{props.user!.discriminator}
                </div>
              </div>

              <div class="profile-divider" />

              <Show when={props.user!.bio}>
                <div class="profile-section">
                  <h3>About Me</h3>
                  <p class="profile-bio">{props.user!.bio}</p>
                </div>
                <div class="profile-divider" />
              </Show>

              <div class="profile-section">
                <h3>Status</h3>
                <div class="profile-status">
                  <div class={`status-dot ${getPresenceClass()}`} />
                  <span>{getPresenceText()}</span>
                </div>
                <Show when={props.user!.status?.text}>
                  <p class="profile-status-text">{props.user!.status?.text}</p>
                </Show>
              </div>

              <Show when={!isCurrentUser()}>
                <div class="profile-divider" />
                <div class="profile-actions">
                  <button class="button-primary" onClick={sendDirectMessage}>
                    Send Message
                  </button>
                  <button 
                    class="button-secondary" 
                    onClick={sendFriendRequest}
                    disabled={sending()}
                  >
                    {sending() ? 'Sending...' : 'Add Friend'}
                  </button>
                </div>
              </Show>
            </div>
          </div>
        </div>
      </div>
    </Show>
  );
};
