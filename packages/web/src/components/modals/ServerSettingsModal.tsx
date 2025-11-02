import { Component, createSignal, Show, For } from 'solid-js';
import { Server } from '../../types';
import { API_URL } from '../../utils/constants';
import { ImageCropper } from '../../ImageCropper';

interface ServerSettingsModalProps {
  server: Server | undefined;
  isOwner?: boolean;
  currentUserId?: string;
  onClose: () => void;
  onUpdate: (server: Server) => void;
  onLeave?: () => void;
}

export const ServerSettingsModal: Component<ServerSettingsModalProps> = (props) => {
  const [name, setName] = createSignal(props.server?.name || '');
  const [description, setDescription] = createSignal(props.server?.description || '');
  const [icon, setIcon] = createSignal(props.server?.icon || '');
  const [saving, setSaving] = createSignal(false);
  const [uploading, setUploading] = createSignal(false);
  const [cropImageUrl, setCropImageUrl] = createSignal<string | null>(null);
  const [invites, setInvites] = createSignal<any[]>([]);
  const [showInvites, setShowInvites] = createSignal(false);
  const [creatingInvite, setCreatingInvite] = createSignal(false);

  // Load invites
  const loadInvites = async () => {
    if (!props.server) return;
    
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/servers/${props.server._id}/invites`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setInvites(data);
      }
    } catch (error) {
      console.error('Error loading invites:', error);
    }
  };

  // Create invite
  const createInvite = async () => {
    if (!props.server) return;
    
    setCreatingInvite(true);
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/servers/${props.server._id}/invites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          maxUses: 0,  // Unlimited uses
          expiresIn: 604800  // 7 days
        })
      });
      
      if (response.ok) {
        await loadInvites();
      }
    } catch (error) {
      console.error('Error creating invite:', error);
    } finally {
      setCreatingInvite(false);
    }
  };

  // Delete invite
  const deleteInvite = async (inviteId: string) => {
    if (!props.server) return;
    
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/servers/${props.server._id}/invites/${inviteId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        setInvites(invites().filter(i => i._id !== inviteId));
      }
    } catch (error) {
      console.error('Error deleting invite:', error);
    }
  };

  // Leave server
  const handleLeaveServer = async () => {
    if (!props.server) return;
    
    const isOwner = props.server.owner === props.currentUserId;
    const confirmMessage = isOwner
      ? 'You are the owner of this server. Leaving will DELETE the server permanently. Are you sure?'
      : 'Are you sure you want to leave this server?';
    
    if (!confirm(confirmMessage)) return;
    
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/servers/${props.server._id}/leave`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        props.onLeave?.();
        props.onClose();
      }
    } catch (error) {
      console.error('Error leaving server:', error);
      alert('Failed to leave server');
    }
  };

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
            <Show when={props.isOwner} fallback={
              <div class="settings-section">
                <h3>Overview</h3>
                <p>Only the server owner can modify server settings.</p>
                <label>
                  Server ID
                  <input type="text" value={props.server?._id || ''} disabled />
                </label>
              </div>
            }>
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
            </Show>

            <Show when={props.isOwner}>
              <div class="settings-section">
                <h3>Invites</h3>
                <button 
                  type="button" 
                  class="button-secondary"
                  onClick={() => {
                    const newShowState = !showInvites();
                    setShowInvites(newShowState);
                    if (newShowState) {
                      loadInvites();
                    }
                  }}
                >
                  {showInvites() ? 'Hide Invites' : 'Show Invites'}
                </button>
                
                <Show when={showInvites()}>
                  <div class="invites-list">
                    <button 
                      type="button" 
                      class="button-primary" 
                      onClick={createInvite}
                      disabled={creatingInvite()}
                    >
                      {creatingInvite() ? 'Creating...' : 'Create Invite'}
                    </button>
                    
                    <For each={invites()}>
                      {(invite) => (
                        <div class="invite-item">
                          <code class="invite-code">{invite._id}</code>
                          <span class="invite-uses">Uses: {invite.uses}/{invite.maxUses || '∞'}</span>
                          <button 
                            type="button"
                            class="button-danger-small"
                            onClick={() => deleteInvite(invite._id)}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </For>
                    
                    <Show when={invites().length === 0}>
                      <p class="no-invites">No active invites</p>
                    </Show>
                  </div>
                </Show>
              </div>
            </Show>

            <div class="settings-section danger-zone">
              <h3>Danger Zone</h3>
              <button 
                type="button" 
                class="button-danger"
                onClick={handleLeaveServer}
              >
                Leave Server
              </button>
              <p class="danger-text">
                {props.server?.owner === props.currentUserId
                  ? 'Warning: Leaving will permanently delete this server!'
                  : 'You will no longer have access to this server.'}
              </p>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="button-secondary" onClick={props.onClose}>
              {props.isOwner ? 'Cancel' : 'Close'}
            </button>
            <Show when={props.isOwner}>
              <button type="submit" class="button-primary" disabled={saving()}>
                {saving() ? 'Saving...' : 'Save Changes'}
              </button>
            </Show>
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
