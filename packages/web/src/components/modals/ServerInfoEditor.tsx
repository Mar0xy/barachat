import { Component, createSignal, Show } from 'solid-js';
import { Server } from '../../types';
import { API_URL } from '../../utils/constants';
import { ImageCropper } from '../../ImageCropper';

interface ServerInfoEditorProps {
  server: Server;
  onUpdate: (server: Server) => void;
}

export const ServerInfoEditor: Component<ServerInfoEditorProps> = (props) => {
  const [name, setName] = createSignal(props.server.name || '');
  const [description, setDescription] = createSignal(props.server.description || '');
  const [icon, setIcon] = createSignal(props.server.icon || '');
  const [saving, setSaving] = createSignal(false);
  const [uploading, setUploading] = createSignal(false);
  const [cropImageUrl, setCropImageUrl] = createSignal<string | null>(null);

  const handleFileSelect = (e: Event) => {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCropImageUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCroppedImage = async (blob: Blob) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('icon', blob, 'server-icon.png');

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/upload/server-icon`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setIcon(data.url);
        setCropImageUrl(null);
      }
    } catch (error) {
      console.error('Error uploading icon:', error);
    } finally {
      setUploading(false);
    }
  };

  const saveChanges = async () => {
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
      }
    } catch (error) {
      console.error('Error updating server:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Show when={cropImageUrl()}>
        <ImageCropper
          imageUrl={cropImageUrl()!}
          onCrop={handleCroppedImage}
          onCancel={() => setCropImageUrl(null)}
          aspectRatio={1}
          cropShape="round"
        />
      </Show>

      <div class="settings-section">
        <label>
          Server Name
          <input
            type="text"
            value={name()}
            onInput={(e) => setName(e.currentTarget.value)}
            placeholder="Enter server name"
          />
        </label>

        <label>
          Description
          <textarea
            value={description()}
            onInput={(e) => setDescription(e.currentTarget.value)}
            placeholder="Enter server description"
            rows="3"
          />
        </label>

        <label>
          Server Icon
          <input type="file" accept="image/*" onChange={handleFileSelect} />
        </label>

        <Show when={icon()}>
          <div class="avatar-preview">
            <p>Current Icon:</p>
            <img src={icon()} alt="Server icon" class="preview-image" />
          </div>
        </Show>

        <Show when={uploading()}>
          <div class="upload-status">Uploading icon...</div>
        </Show>
      </div>

      <div class="settings-actions">
        <button class="button-primary" onClick={saveChanges} disabled={saving()}>
          {saving() ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </>
  );
};
