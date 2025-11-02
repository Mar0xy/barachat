import { Component, createSignal, Show } from 'solid-js';
import { Server } from '../../types';
import { API_URL } from '../../utils/constants';
import ImageCropper from '../../ImageCropper';

interface ServerSettingsModalProps {
  server: Server | undefined;
  onClose: () => void;
  onUpdate: (server: Server) => void;
}

export const ServerSettingsModal: Component<ServerSettingsModalProps> = (props) => {
  const [name, setName] = createSignal(props.server?.name || '');
  const [description, setDescription] = createSignal(props.server?.description || '');
  const [icon, setIcon] = createSignal(props.server?.icon || '');
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
    formData.append('icon', blob, 'server-icon.png');

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/upload/server-icon`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setIcon(data.url);
      } else {
        alert('Failed to upload server icon');
      }
    } catch (error) {
      console.error('Error uploading server icon:', error);
      alert('Error uploading server icon');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: Event) => {
    e.preventDefault();
    if (!props.server) return;

    setSaving(true);
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`${API_URL}/servers/${props.server._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: name(),
          description: description(),
          icon: icon()
        })
      });

      if (response.ok) {
        const updatedServer = await response.json();
        props.onUpdate(updatedServer);
        props.onClose();
      }
    } catch (error) {
      console.error('Error updating server:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div class="modal-overlay" onClick={props.onClose}>
      <div class="modal" onClick={(e) => e.stopPropagation()}>
        <div class="modal-header">
          <h2>Server Settings</h2>
          <button class="modal-close" onClick={props.onClose}>×</button>
        </div>
        <form onSubmit={handleSave}>
          <div class="modal-body">
            <div class="settings-section">
              <h3>Overview</h3>
              <label>
                Server Name
                <input 
                  type="text" 
                  value={name()} 
                  onInput={(e) => setName(e.currentTarget.value)}
                  placeholder="Server Name"
                />
              </label>
              <label>
                Description
                <textarea
                  value={description()}
                  onInput={(e) => setDescription(e.currentTarget.value)}
                  placeholder="Server description"
                  rows={3}
                />
              </label>
              <label>
                Server Icon
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  disabled={uploading()}
                />
                {uploading() && <p class="upload-status">Uploading...</p>}
              </label>
              <label>
                Server Icon URL (or upload above)
                <input
                  type="text"
                  value={icon()}
                  onInput={(e) => setIcon(e.currentTarget.value)}
                  placeholder="Enter icon image URL (e.g., https://...)"
                />
              </label>
              <Show when={icon()}>
                <div class="avatar-preview">
                  <p>Icon Preview:</p>
                  <img src={icon()} alt="Server icon preview" class="preview-image" />
                </div>
              </Show>
              <label>
                Server ID
                <input type="text" value={props.server?._id || ''} disabled />
              </label>
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
            title="Crop Server Icon"
          />
        </Show>
      </div>
    </div>
  );
};
