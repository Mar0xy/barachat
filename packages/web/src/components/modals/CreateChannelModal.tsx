import { Component, createSignal } from 'solid-js';
import { Channel } from '../../types';
import { API_URL } from '../../utils/constants';

interface CreateChannelModalProps {
  serverId: string;
  onClose: () => void;
  onCreate: (channel: Channel) => void;
}

export const CreateChannelModal: Component<CreateChannelModalProps> = (props) => {
  const [name, setName] = createSignal('');
  const [description, setDescription] = createSignal('');

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!name().trim() || !props.serverId) return;

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/servers/${props.serverId}/channels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: name(),
          description: description()
        })
      });

      if (response.ok) {
        const channel = await response.json();
        props.onCreate(channel);
        props.onClose();
      }
    } catch (error) {
      console.error('Error creating channel:', error);
    }
  };

  return (
    <div class="modal-overlay" onClick={props.onClose}>
      <div class="modal" onClick={(e) => e.stopPropagation()}>
        <div class="modal-header">
          <h2>Create Text Channel</h2>
          <button class="modal-close" onClick={props.onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div class="modal-body">
            <label>
              Channel Name
              <input
                type="text"
                value={name()}
                onInput={(e) => setName(e.currentTarget.value)}
                placeholder="general"
                required
              />
            </label>
            <label>
              Description (optional)
              <textarea
                value={description()}
                onInput={(e) => setDescription(e.currentTarget.value)}
                placeholder="Channel topic..."
                rows={3}
              />
            </label>
          </div>
          <div class="modal-footer">
            <button type="button" class="button-secondary" onClick={props.onClose}>Cancel</button>
            <button type="submit" class="button-primary">Create Channel</button>
          </div>
        </form>
      </div>
    </div>
  );
};
