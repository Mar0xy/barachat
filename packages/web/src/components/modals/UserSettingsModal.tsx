import { Component } from 'solid-js';
import { User } from '../../types';
import { UserProfileEditor } from '../UserProfileEditor';

interface UserSettingsModalProps {
  user: User | null;
  onClose: () => void;
  onUpdate: (user: User) => void;
  onLogout?: () => void;
}

export const UserSettingsModal: Component<UserSettingsModalProps> = (props) => {
  if (!props.user) return null;

  return (
    <div class="settings-overlay" onClick={props.onClose}>
      <div class="settings-modal" onClick={(e) => e.stopPropagation()}>
        <button class="settings-close" onClick={props.onClose}>
          ×
        </button>

        <div class="settings-sidebar">
          <div class="settings-sidebar-header">User Settings</div>
          <nav class="settings-nav">
            <div class="settings-nav-item active">My Account</div>
            <div class="settings-nav-item">Profile</div>
            <div class="settings-nav-item">Privacy & Safety</div>
          </nav>
          <div class="settings-logout" onClick={props.onLogout}>
            Logout
          </div>
        </div>

        <div class="settings-content">
          <div class="settings-content-inner">
            <h1 class="settings-title">My Account</h1>
            
            <UserProfileEditor user={props.user} onUpdate={props.onUpdate} />

            <div class="settings-divider" />

            <div class="settings-section">
              <h3>Account Information</h3>
              <label>
                Username
                <input type="text" value={props.user.username} disabled />
              </label>
              <label>
                Email
                <input type="text" value={props.user.email} disabled />
              </label>
              <label>
                User ID
                <input type="text" value={props.user._id} disabled />
              </label>
              <p class="settings-note">
                Username, email, and user ID cannot be changed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
