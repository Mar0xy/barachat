import { Component, createSignal, Show } from 'solid-js';
import { Server } from '../../types';
import { API_URL } from '../../utils/constants';
import { ServerInfoEditor } from './ServerInfoEditor';
import { InviteManager } from './InviteManager';

interface ServerSettingsModalProps {
  server: Server | undefined;
  isOwner?: boolean;
  currentUserId?: string;
  onClose: () => void;
  onUpdate: (server: Server) => void;
  onLeave?: () => void;
}

export const ServerSettingsModal: Component<ServerSettingsModalProps> = (props) => {
  const [showInvites, setShowInvites] = createSignal(false);
  const [showDangerZone, setShowDangerZone] = createSignal(false);
  const [confirmDelete, setConfirmDelete] = createSignal('');

  const handleLeave = async () => {
    if (!props.server) return;

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
    }
  };

  const handleDelete = async () => {
    if (!props.server || confirmDelete() !== props.server.name) {
      alert('Please type the server name correctly to confirm deletion.');
      return;
    }

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/servers/${props.server._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        props.onClose();
      }
    } catch (error) {
      console.error('Error deleting server:', error);
    }
  };

  return (
    <div class="modal-overlay" onClick={props.onClose}>
      <div class="modal" onClick={(e) => e.stopPropagation()}>
        <div class="modal-header">
          <h2>Server Settings</h2>
          <button class="modal-close" onClick={props.onClose}>
            ×
          </button>
        </div>

        <div class="modal-body">
          <Show
            when={props.isOwner}
            fallback={
              <div class="settings-section">
                <h3>Overview</h3>
                <p>Only the server owner can modify server settings.</p>
                <label>
                  Server ID
                  <input type="text" value={props.server?._id || ''} disabled />
                </label>
              </div>
            }
          >
            <ServerInfoEditor server={props.server!} onUpdate={props.onUpdate} />

            <div class="settings-divider" />

            <div class="settings-section">
              <h3>Invites</h3>
              <button
                type="button"
                class="button-secondary"
                onClick={() => setShowInvites(!showInvites())}
                style={{ width: '100%', 'margin-bottom': '12px' }}
              >
                {showInvites() ? 'Hide Invites' : 'Manage Invites'}
              </button>

              <Show when={showInvites() && props.server}>
                <InviteManager serverId={props.server!._id} />
              </Show>
            </div>
          </Show>

          <Show when={!props.isOwner && props.onLeave}>
            <div class="settings-divider" />
            <div class="settings-section">
              <h3>Leave Server</h3>
              <p class="settings-note">
                Leave this server. You can rejoin later with an invite.
              </p>
              <button class="button-danger" onClick={handleLeave}>
                Leave Server
              </button>
            </div>
          </Show>

          <Show when={props.isOwner}>
            <div class="settings-divider" />
            <div class="settings-section">
              <h3 style={{ color: '#ed4245' }}>Danger Zone</h3>
              <button
                type="button"
                class="button-secondary"
                onClick={() => setShowDangerZone(!showDangerZone())}
                style={{ width: '100%', 'margin-bottom': '12px' }}
              >
                {showDangerZone() ? 'Hide Danger Zone' : 'Show Danger Zone'}
              </button>

              <Show when={showDangerZone()}>
                <div class="danger-zone">
                  <p class="settings-note" style={{ color: '#ed4245' }}>
                    ⚠️ Warning: This action cannot be undone. All channels, messages, and members
                    will be permanently deleted.
                  </p>
                  <label>
                    Type the server name to confirm deletion
                    <input
                      type="text"
                      value={confirmDelete()}
                      onInput={(e) => setConfirmDelete(e.currentTarget.value)}
                      placeholder={props.server?.name || 'Server name'}
                    />
                  </label>
                  <button class="button-danger" onClick={handleDelete}>
                    Delete Server Permanently
                  </button>
                </div>
              </Show>
            </div>
          </Show>
        </div>
      </div>
    </div>
  );
};
