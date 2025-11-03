import { Component, createSignal, Show } from 'solid-js';
import { User } from '../../types';
import { API_URL } from '../../utils/constants';
import { ImageCropper } from '../../ImageCropper';

interface UserSettingsModalProps {
  user: User | null;
  onClose: () => void;
  onUpdate: (user: User) => void;
  onLogout?: () => void;
}

export const UserSettingsModal: Component<UserSettingsModalProps> = (props) => {
  const [displayName, setDisplayName] = createSignal(props.user?.displayName || '');
  const [bio, setBio] = createSignal(props.user?.bio || '');
  const [statusText, setStatusText] = createSignal(props.user?.status?.text || '');
  const [presence, setPresence] = createSignal(props.user?.status?.presence || 'Online');
  const [avatar, setAvatar] = createSignal(props.user?.avatar || '');
  const [banner, setBanner] = createSignal(props.user?.banner || '');
  const [saving, setSaving] = createSignal(false);
  const [uploading, setUploading] = createSignal(false);
  const [uploadingBanner, setUploadingBanner] = createSignal(false);
  const [cropImageUrl, setCropImageUrl] = createSignal<string | null>(null);
  const [cropBannerUrl, setCropBannerUrl] = createSignal<string | null>(null);

  const handleFileSelect = (e: Event) => {
    const input = e.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        setCropImageUrl(result);
      }
    };

    reader.readAsDataURL(file);
  };

  const handleBannerFileSelect = (e: Event) => {
    const input = e.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        setCropBannerUrl(result);
      }
    };

    reader.readAsDataURL(file);
  };

  const handleCroppedImage = async (blob: Blob) => {
    setUploading(true);
    setCropImageUrl(null);

    const formData = new FormData();
    formData.append('avatar', blob, 'avatar.png');

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
        setAvatar(data.url);
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

  const handleCroppedBanner = async (blob: Blob) => {
    setUploadingBanner(true);
    setCropBannerUrl(null);

    const formData = new FormData();
    formData.append('banner', blob, 'banner.png');

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/upload/banner`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setBanner(data.url);
      } else {
        alert('Failed to upload banner');
      }
    } catch (error) {
      console.error('Error uploading banner:', error);
      alert('Error uploading banner');
    } finally {
      setUploadingBanner(false);
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
          bio: bio(),
          status: {
            text: statusText(),
            presence: presence()
          },
          avatar: avatar(),
          banner: banner()
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
    <div class="settings-overlay" onClick={props.onClose}>
      <div class="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div class="settings-sidebar">
          <div class="settings-sidebar-header">User Settings</div>
          <div class="settings-nav">
            <div class="settings-nav-item active">My Account</div>
          </div>
          <div class="settings-logout" onClick={() => props.onLogout?.()}>
            Log Out
          </div>
        </div>

        <div class="settings-content">
          <button class="settings-close" onClick={props.onClose}>
            ×
          </button>

          <form onSubmit={handleSave}>
            <div class="settings-content-inner">
              <h2 class="settings-title">My Account</h2>

              <div class="settings-section">
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
                  Bio
                  <textarea
                    value={bio()}
                    onInput={(e) => setBio(e.currentTarget.value)}
                    placeholder="Tell us about yourself..."
                    rows={3}
                    maxLength={190}
                  />
                </label>
              </div>

              <div class="settings-divider" />

              <h3 class="settings-subtitle">Status</h3>
              <div class="settings-section">
                <label>
                  Presence
                  <select
                    value={presence()}
                    onChange={(e) => setPresence(e.currentTarget.value as any)}
                  >
                    <option value="Online">🟢 Online</option>
                    <option value="Idle">🟡 Idle</option>
                    <option value="Busy">🔴 Do Not Disturb</option>
                    <option value="Invisible">⚫ Invisible</option>
                  </select>
                </label>
                <label>
                  Custom Status
                  <input
                    type="text"
                    value={statusText()}
                    onInput={(e) => setStatusText(e.currentTarget.value)}
                    placeholder="What's happening?"
                    maxLength={128}
                  />
                </label>
              </div>

              <div class="settings-divider" />

              <h3 class="settings-subtitle">Avatar</h3>
              <div class="settings-section">
                <label>
                  Upload Avatar
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
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

              <div class="settings-divider" />

              <h3 class="settings-subtitle">Banner</h3>
              <div class="settings-section">
                <label>
                  Upload Banner
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBannerFileSelect}
                    disabled={uploadingBanner()}
                  />
                  {uploadingBanner() && <p class="upload-status">Uploading...</p>}
                </label>
                <label>
                  Banner URL (or upload above)
                  <input
                    type="text"
                    value={banner()}
                    onInput={(e) => setBanner(e.currentTarget.value)}
                    placeholder="Enter banner image URL (e.g., https://...)"
                  />
                </label>
                <Show when={banner()}>
                  <div class="banner-preview">
                    <p>Banner Preview:</p>
                    <img src={banner()} alt="Banner preview" class="preview-image-banner" />
                  </div>
                </Show>
              </div>

              <div class="settings-actions">
                <button type="button" class="button-secondary" onClick={props.onClose}>
                  Cancel
                </button>
                <button type="submit" class="button-primary" disabled={saving()}>
                  {saving() ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </form>
        </div>

        <Show when={cropImageUrl()}>
          <ImageCropper
            imageUrl={cropImageUrl()!}
            onCrop={handleCroppedImage}
            onCancel={() => setCropImageUrl(null)}
            title="Crop Avatar"
            aspectRatio={1}
          />
        </Show>

        <Show when={cropBannerUrl()}>
          <ImageCropper
            imageUrl={cropBannerUrl()!}
            onCrop={handleCroppedBanner}
            onCancel={() => setCropBannerUrl(null)}
            title="Crop Banner"
            aspectRatio={3}
          />
        </Show>
      </div>
    </div>
  );
};
