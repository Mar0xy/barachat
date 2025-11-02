import { Component, createSignal } from 'solid-js';
import { Server } from '../../types';
import { API_URL } from '../../utils/constants';

interface CreateServerModalProps {
  onClose: () => void;
  onCreate: (name: string, description: string) => void;
}

export const CreateServerModal: Component<CreateServerModalProps> = (props) => {
  const [name, setName] = createSignal('');
  const [description, setDescription] = createSignal('');

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!name().trim()) return;

    props.onCreate(name(), description());
  };

  return (
    <div class="modal-overlay" onClick={props.onClose}>
      <div class="modal" onClick={(e) => e.stopPropagation()}>
        <div class="modal-header">
          <h2>Create a Server</h2>
          <button class="modal-close" onClick={props.onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
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
            <button type="button" class="button-secondary" onClick={props.onClose}>Cancel</button>
            <button type="submit" class="button-primary">Create Server</button>
          </div>
        </form>
      </div>
    </div>
  );
};
