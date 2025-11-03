import { Component, createSignal } from 'solid-js';
import { User } from '../types';
import { API_URL } from '../utils/constants';
import { ProfileImageUploader } from './ProfileImageUploader';

interface UserProfileEditorProps {
  user: User;
  onUpdate: (user: User) => void;
}

export const UserProfileEditor: Component<UserProfileEditorProps> = (props) => {
  const [displayName, setDisplayName] = createSignal(props.user.displayName || '');
  const [bio, setBio] = createSignal(props.user.bio || '');
  const [statusText, setStatusText] = createSignal(props.user.status?.text || '');
  const [presence, setPresence] = createSignal(props.user.status?.presence || 'Online');
  const [avatar, setAvatar] = createSignal(props.user.avatar || '');
  const [banner, setBanner] = createSignal(props.user.banner || '');
  const [saving, setSaving] = createSignal(false);

  const handleSave = async () => {
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
          bio: bio(),
          avatar: avatar(),
          banner: banner(),
          status: {
            presence: presence(),
            text: statusText()
          }
        })
      });

      if (response.ok) {
        const updatedUser = await response.json();
        props.onUpdate(updatedUser);
      }
    } catch (error) {
      console.error('Error updating user:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div class="settings-section">
        <h3>Profile</h3>
        
        <label>
          Display Name
          <input
            type="text"
            value={displayName()}
            onInput={(e) => setDisplayName(e.currentTarget.value)}
            placeholder="Your display name"
          />
        </label>

        <label>
          Bio
          <textarea
            value={bio()}
            onInput={(e) => setBio(e.currentTarget.value)}
            placeholder="Tell us about yourself"
            rows={3}
          />
        </label>

        <label>
          Status
          <select value={presence()} onChange={(e) => setPresence(e.currentTarget.value as any)}>
            <option value="Online">Online</option>
            <option value="Idle">Idle</option>
            <option value="DND">Do Not Disturb</option>
            <option value="Invisible">Invisible</option>
          </select>
        </label>

        <label>
          Status Text
          <input
            type="text"
            value={statusText()}
            onInput={(e) => setStatusText(e.currentTarget.value)}
            placeholder="What's on your mind?"
          />
        </label>
      </div>

      <div class="settings-divider" />

      <div class="settings-section">
        <h3>Images</h3>
        <ProfileImageUploader
          currentAvatar={avatar()}
          currentBanner={banner()}
          onAvatarUpdate={setAvatar}
          onBannerUpdate={setBanner}
        />
      </div>

      <div class="settings-actions">
        <button class="button-primary" onClick={handleSave} disabled={saving()}>
          {saving() ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </>
  );
};
