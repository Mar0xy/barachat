import { Component, createSignal } from 'solid-js';
import { Channel } from '../../types';
import { API_URL } from '../../utils/constants';

interface CreateChannelModalProps {
  serverId: string;
  categories?: Channel[]; // Categories to choose from
  onClose: () => void;
  onCreate: (channel: Channel) => void;
}

export const CreateChannelModal: Component<CreateChannelModalProps> = (props) => {
  const [name, setName] = createSignal('');
  const [description, setDescription] = createSignal('');
  const [channelType, setChannelType] = createSignal<'TextChannel' | 'Category'>('TextChannel');
  const [selectedCategory, setSelectedCategory] = createSignal('');

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
          description: description(),
          channelType: channelType(),
          ...(channelType() === 'TextChannel' && selectedCategory() && { category: selectedCategory() })
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
          <h2>Create {channelType() === 'Category' ? 'Category' : 'Text Channel'}</h2>
          <button class="modal-close" onClick={props.onClose}>
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div class="modal-body">
            <label>
              Type
              <select
                value={channelType()}
                onChange={(e) => setChannelType(e.currentTarget.value as 'TextChannel' | 'Category')}
                style={{
                  width: '100%',
                  padding: '10px',
                  'margin-top': '8px',
                  background: '#2a2a2a',
                  border: '1px solid #2a2a2a',
                  'border-radius': '4px',
                  color: '#fff',
                  'font-size': '15px'
                }}
              >
                <option value="TextChannel">Text Channel</option>
                <option value="Category">Category</option>
              </select>
            </label>
            <label>
              {channelType() === 'Category' ? 'Category' : 'Channel'} Name
              <input
                type="text"
                value={name()}
                onInput={(e) => setName(e.currentTarget.value)}
                placeholder={channelType() === 'Category' ? 'New Category' : 'general'}
                required
              />
            </label>
            {channelType() === 'TextChannel' && (
              <>
                <label>
                  Description (optional)
                  <textarea
                    value={description()}
                    onInput={(e) => setDescription(e.currentTarget.value)}
                    placeholder="Channel topic..."
                    rows={3}
                  />
                </label>
                {props.categories && props.categories.length > 0 && (
                  <label>
                    Category (optional)
                    <select
                      value={selectedCategory()}
                      onChange={(e) => setSelectedCategory(e.currentTarget.value)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        'margin-top': '8px',
                        background: '#2a2a2a',
                        border: '1px solid #2a2a2a',
                        'border-radius': '4px',
                        color: '#fff',
                        'font-size': '15px'
                      }}
                    >
                      <option value="">No Category</option>
                      {props.categories.map((cat) => (
                        <option value={cat._id}>{cat.name}</option>
                      ))}
                    </select>
                  </label>
                )}
              </>
            )}
          </div>
          <div class="modal-footer">
            <button type="button" class="button-secondary" onClick={props.onClose}>
              Cancel
            </button>
            <button type="submit" class="button-primary">
              Create {channelType() === 'Category' ? 'Category' : 'Channel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
