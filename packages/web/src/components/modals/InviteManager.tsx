import { Component, createSignal, Show, For, onMount } from 'solid-js';
import { API_URL } from '../../utils/constants';

interface InviteManagerProps {
  serverId: string;
}

export const InviteManager: Component<InviteManagerProps> = (props) => {
  const [invites, setInvites] = createSignal<any[]>([]);
  const [creatingInvite, setCreatingInvite] = createSignal(false);
  const [inviteMaxUses, setInviteMaxUses] = createSignal(0);
  const [showInviteOptions, setShowInviteOptions] = createSignal(false);

  // Load invites
  const loadInvites = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/servers/${props.serverId}/invites`, {
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
    setCreatingInvite(true);
    const token = localStorage.getItem('token');

    try {
      const maxUses = inviteMaxUses() || undefined;
      const response = await fetch(`${API_URL}/servers/${props.serverId}/invites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ maxUses })
      });

      if (response.ok) {
        await loadInvites();
        setInviteMaxUses(0);
        setShowInviteOptions(false);
      }
    } catch (error) {
      console.error('Error creating invite:', error);
    } finally {
      setCreatingInvite(false);
    }
  };

  // Delete invite
  const deleteInvite = async (inviteCode: string) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/servers/${props.serverId}/invites/${inviteCode}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        setInvites(invites().filter((i) => i.code !== inviteCode));
      }
    } catch (error) {
      console.error('Error deleting invite:', error);
    }
  };

  onMount(() => {
    loadInvites();
  });

  return (
    <div class="invites-list">
      <div class="invite-create-form">
        <Show
          when={!showInviteOptions()}
          fallback={
            <>
              <label>
                Max Uses (0 = unlimited)
                <input
                  type="number"
                  min="0"
                  value={inviteMaxUses()}
                  onInput={(e) => setInviteMaxUses(parseInt(e.currentTarget.value) || 0)}
                  placeholder="0"
                />
              </label>
              <div class="invite-form-actions">
                <button
                  class="button-primary"
                  onClick={createInvite}
                  disabled={creatingInvite()}
                >
                  {creatingInvite() ? 'Creating...' : 'Create Invite'}
                </button>
                <button
                  class="button-secondary"
                  onClick={() => {
                    setShowInviteOptions(false);
                    setInviteMaxUses(0);
                  }}
                >
                  Cancel
                </button>
              </div>
            </>
          }
        >
          <button
            class="button-primary"
            onClick={() => setShowInviteOptions(true)}
            style={{ width: '100%' }}
          >
            Create New Invite
          </button>
        </Show>
      </div>

      <Show
        when={invites().length > 0}
        fallback={
          <div class="no-invites">
            No active invites. Create one to invite people to your server!
          </div>
        }
      >
        <For each={invites()}>
          {(invite) => (
            <div class="invite-item">
              <div class="invite-info">
                <div class="invite-code">{invite.code}</div>
                <div class="invite-meta">
                  <span>Uses: {invite.uses || 0}</span>
                  {invite.maxUses > 0 && <span> / {invite.maxUses}</span>}
                  {invite.expiresAt && (
                    <span class="invite-expires">
                      {' '}
                      • Expires: {new Date(invite.expiresAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <button class="button-danger-small" onClick={() => deleteInvite(invite.code)}>
                Delete
              </button>
            </div>
          )}
        </For>
      </Show>
    </div>
  );
};
