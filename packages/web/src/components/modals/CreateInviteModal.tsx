import { Component, createSignal } from 'solid-js';

interface CreateInviteModalProps {
  serverId: string;
  onClose: () => void;
  onInviteCreated: (invite: any) => void;
}

export const CreateInviteModal: Component<CreateInviteModalProps> = (props) => {
  const [maxUses, setMaxUses] = createSignal(0);
  const [expiresIn, setExpiresIn] = createSignal(0);
  const [error, setError] = createSignal('');

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/servers/${props.serverId}/invites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          maxUses: maxUses() || undefined,
          expiresIn: expiresIn() || undefined
        })
      });

      if (response.ok) {
        const invite = await response.json();
        props.onInviteCreated(invite);
        props.onClose();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create invite');
      }
    } catch (err) {
      console.error('Error creating invite:', err);
      setError('Failed to create invite');
    }
  };

  return (
    <div class="modal-overlay" onClick={props.onClose}>
      <div class="modal" onClick={(e) => e.stopPropagation()}>
        <div class="modal-header">
          <h2>Create Invite</h2>
          <button class="modal-close" onClick={props.onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div class="modal-body">
            <label>
              Max Uses (0 = unlimited)
              <input
                type="number"
                min="0"
                value={maxUses()}
                onInput={(e) => setMaxUses(parseInt(e.currentTarget.value) || 0)}
              />
            </label>
            <label>
              Expires After (seconds, 0 = never)
              <input
                type="number"
                min="0"
                value={expiresIn()}
                onInput={(e) => setExpiresIn(parseInt(e.currentTarget.value) || 0)}
              />
              <small>Common values: 3600 (1 hour), 86400 (1 day), 604800 (1 week)</small>
            </label>
            {error() && <div class="error-message">{error()}</div>}
          </div>
          <div class="modal-footer">
            <button type="button" class="button-secondary" onClick={props.onClose}>Cancel</button>
            <button type="submit" class="button-primary">Create Invite</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Import API_URL for the component to work
import { API_URL } from '../../utils/constants';
