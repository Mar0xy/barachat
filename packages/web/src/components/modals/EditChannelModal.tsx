import { Component, createSignal, For, Show } from 'solid-js';
import { Channel } from '../../types';

interface EditChannelModalProps {
  channel: Channel;
  categories: Channel[];
  onClose: () => void;
  onUpdate: (channelId: string, name: string, category?: string) => void;
  onDelete: (channelId: string, deleteChannels?: boolean) => void;
}

export const EditChannelModal: Component<EditChannelModalProps> = (props) => {
  const [name, setName] = createSignal(props.channel.name || '');
  const [category, setCategory] = createSignal(props.channel.category || '');

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (name().trim()) {
      props.onUpdate(props.channel._id, name().trim(), category() || undefined);
      props.onClose();
    }
  };

  const handleDelete = () => {
    if (props.channel.channelType === 'Category') {
      // For categories, ask if they want to delete channels too
      const deleteChannels = confirm(
        `Do you want to delete all channels in "${props.channel.name}" category?\n\n` +
        `Click OK to delete channels, or Cancel to only delete the category (channels will become uncategorized).`
      );
      
      if (confirm(`Are you sure you want to delete the "${props.channel.name}" category?`)) {
        props.onDelete(props.channel._id, deleteChannels);
        props.onClose();
      }
    } else {
      // For regular channels
      if (confirm(`Are you sure you want to delete #${props.channel.name}?`)) {
        props.onDelete(props.channel._id);
        props.onClose();
      }
    }
  };

  return (
    <div class="modal-overlay" onClick={props.onClose}>
      <div class="modal" onClick={(e) => e.stopPropagation()}>
        <div class="modal-header">
          <h2>Edit {props.channel.channelType === 'Category' ? 'Category' : 'Channel'}</h2>
          <button class="modal-close" onClick={props.onClose}>×</button>
        </div>
        <form class="modal-body" onSubmit={handleSubmit}>
          <label>
            {props.channel.channelType === 'Category' ? 'Category' : 'Channel'} Name
            <input
              type="text"
              value={name()}
              onInput={(e) => setName(e.currentTarget.value)}
              placeholder={props.channel.channelType === 'Category' ? 'category-name' : 'channel-name'}
              required
            />
          </label>

          <Show when={props.channel.channelType !== 'Category'}>
            <label>
              Category
              <select
                value={category()}
                onInput={(e) => setCategory(e.currentTarget.value)}
              >
                <option value="">No Category</option>
                <For each={props.categories}>
                  {(cat) => (
                    <option value={cat._id}>{cat.name}</option>
                  )}
                </For>
              </select>
            </label>
          </Show>

          <div class="modal-actions">
            <button type="submit" class="button-primary">
              Save Changes
            </button>
            <button type="button" class="button-danger" onClick={handleDelete}>
              Delete {props.channel.channelType === 'Category' ? 'Category' : 'Channel'}
            </button>
            <button type="button" class="button-secondary" onClick={props.onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
