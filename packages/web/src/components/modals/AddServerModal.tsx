import { Component, createSignal, Show } from 'solid-js';
import { API_URL } from '../../utils/constants';

interface AddServerModalProps {
  onClose: () => void;
  onCreate: (name: string, description: string) => void;
  onJoin: (server: any) => void;
}

export const AddServerModal: Component<AddServerModalProps> = (props) => {
  const [mode, setMode] = createSignal<'choose' | 'create' | 'join'>('choose');
  const [name, setName] = createSignal('');
  const [description, setDescription] = createSignal('');
  const [inviteCode, setInviteCode] = createSignal('');
  const [error, setError] = createSignal('');

  const handleCreateSubmit = async (e: Event) => {
    e.preventDefault();
    if (!name().trim()) return;
    props.onCreate(name(), description());
  };

  const handleJoinSubmit = async (e: Event) => {
    e.preventDefault();
    if (!inviteCode().trim()) return;

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/servers/join/${inviteCode()}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const server = await response.json();
        props.onJoin(server);
        props.onClose();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to join server');
      }
    } catch (err) {
      console.error('Error joining server:', err);
      setError('Failed to join server');
    }
  };

  return (
    <div class="modal-overlay" onClick={props.onClose}>
      <div class="modal" onClick={(e) => e.stopPropagation()}>
        <Show when={mode() === 'choose'}>
          <div class="modal-header">
            <h2>Add a Server</h2>
            <button class="modal-close" onClick={props.onClose}>×</button>
          </div>
          <div class="modal-body">
            <div class="add-server-choice">
              <button class="choice-button" onClick={() => setMode('create')}>
                <div class="choice-icon">➕</div>
                <div class="choice-text">
                  <h3>Create My Own</h3>
                  <p>Create a new server for your community</p>
                </div>
              </button>
              <button class="choice-button" onClick={() => setMode('join')}>
                <div class="choice-icon">🔗</div>
                <div class="choice-text">
                  <h3>Join a Server</h3>
                  <p>Enter an invite code to join an existing server</p>
                </div>
              </button>
            </div>
          </div>
        </Show>

        <Show when={mode() === 'create'}>
          <div class="modal-header">
            <button class="modal-back" onClick={() => setMode('choose')}>←</button>
            <h2>Create a Server</h2>
            <button class="modal-close" onClick={props.onClose}>×</button>
          </div>
          <form onSubmit={handleCreateSubmit}>
            <div class="modal-body">
              <label>
                Server Name
                <input
                  type="text"
                  value={name()}
                  onInput={(e) => setName(e.currentTarget.value)}
                  placeholder="My Awesome Server"
                  required
                />
              </label>
              <label>
                Description (optional)
                <textarea
                  value={description()}
                  onInput={(e) => setDescription(e.currentTarget.value)}
                  placeholder="What's your server about?"
                  rows={3}
                />
              </label>
            </div>
            <div class="modal-footer">
              <button type="button" class="button-secondary" onClick={() => setMode('choose')}>Back</button>
              <button type="submit" class="button-primary">Create Server</button>
            </div>
          </form>
        </Show>

        <Show when={mode() === 'join'}>
          <div class="modal-header">
            <button class="modal-back" onClick={() => setMode('choose')}>←</button>
            <h2>Join a Server</h2>
            <button class="modal-close" onClick={props.onClose}>×</button>
          </div>
          <form onSubmit={handleJoinSubmit}>
            <div class="modal-body">
              <label>
                Invite Code
                <input
                  type="text"
                  value={inviteCode()}
                  onInput={(e) => {
                    setInviteCode(e.currentTarget.value);
                    setError('');
                  }}
                  placeholder="Enter invite code"
                  required
                />
              </label>
              <Show when={error()}>
                <div class="error-message">{error()}</div>
              </Show>
              <p class="help-text">
                Invite codes look like: 01ARZ3NDEKTSV4RRFFQ69G5FAV
              </p>
            </div>
            <div class="modal-footer">
              <button type="button" class="button-secondary" onClick={() => setMode('choose')}>Back</button>
              <button type="submit" class="button-primary">Join Server</button>
            </div>
          </form>
        </Show>
      </div>
    </div>
  );
};
