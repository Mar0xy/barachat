import { Component, createSignal, Show } from 'solid-js';
import { User } from '../../types';
import { API_URL } from '../../utils/constants';
import { ImageCropper } from '../../ImageCropper';

interface UserSettingsModalProps {
  user: User | null;
  onClose: () => void;
  onUpdate: (user: User) => void;
}

export const UserSettingsModal: Component<UserSettingsModalProps> = (props) => {
  const [displayName, setDisplayName] = createSignal(props.user?.displayName || '');
  const [avatar, setAvatar] = createSignal(props.user?.avatar || '');
  const [saving, setSaving] = createSignal(false);
  const [uploading, setUploading] = createSignal(false);
  const [cropImageUrl, setCropImageUrl] = createSignal<string | null>(null);

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
          avatar: avatar()
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
    <div class="modal-overlay" onClick={props.onClose}>
      <div class="modal" onClick={(e) => e.stopPropagation()}>
        <div class="modal-header">
          <h2>User Settings</h2>
          <button class="modal-close" onClick={props.onClose}>×</button>
        </div>
        <form onSubmit={handleSave}>
          <div class="modal-body">
            <div class="settings-section">
              <h3>My Account</h3>
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
                Avatar
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
          </div>
          <div class="modal-footer">
            <button type="button" class="button-secondary" onClick={props.onClose}>Cancel</button>
            <button type="submit" class="button-primary" disabled={saving()}>
              {saving() ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
        <Show when={cropImageUrl()}>
          <ImageCropper
            imageUrl={cropImageUrl()!}
            onCrop={handleCroppedImage}
            onCancel={() => setCropImageUrl(null)}
            title="Crop Avatar"
          />
        </Show>
      </div>
    </div>
  );
};
