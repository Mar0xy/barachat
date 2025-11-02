import { Component, createSignal, For, Show, onMount } from 'solid-js';
import twemoji from 'twemoji';

interface EmojiPickerProps {
  onSelectEmoji: (emoji: string) => void;
  onClose: () => void;
}

interface EmojiCategory {
  name: string;
  emojis: string[];
}

export const EmojiPicker: Component<EmojiPickerProps> = (props) => {
  const [selectedCategory, setSelectedCategory] = createSignal(0);
  const [searchQuery, setSearchQuery] = createSignal('');

  const emojiCategories: EmojiCategory[] = [
    {
      name: '😀 Smileys',
      emojis: [
        '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂',
        '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩',
        '😘', '😗', '😚', '😙', '🥲', '😋', '😛', '😜',
        '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐',
        '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬',
        '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒',
        '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '😶‍🌫️', '🥴',
        '😵', '😵‍💫', '🤯', '🤠', '🥳', '🥸', '😎', '🤓',
      ],
    },
    {
      name: '👋 Gestures',
      emojis: [
        '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏',
        '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆',
        '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛',
        '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️',
        '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶', '👂',
        '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀',
      ],
    },
    {
      name: '❤️ Hearts',
      emojis: [
        '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
        '🤎', '💔', '❤️‍🔥', '❤️‍🩹', '❣️', '💕', '💞', '💓',
        '💗', '💖', '💘', '💝', '💟',
      ],
    },
    {
      name: '🐶 Animals',
      emojis: [
        '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
        '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵',
        '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤',
        '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗',
        '🐴', '🦄', '🐝', '🪱', '🐛', '🦋', '🐌', '🐞',
        '🐜', '🪰', '🪲', '🪳', '🦟', '🦗', '🕷️', '🕸️',
      ],
    },
    {
      name: '🍎 Food',
      emojis: [
        '🍎', '🍏', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓',
        '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝',
        '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑',
        '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠', '🥐',
        '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈',
        '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭',
      ],
    },
    {
      name: '⚽ Activities',
      emojis: [
        '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉',
        '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍',
        '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿',
        '🥊', '🥋', '🎽', '🛹', '🛼', '🛷', '⛸️', '🥌',
        '🎿', '⛷️', '🏂', '🪂', '🏋️', '🤼', '🤸', '🤺',
        '⛹️', '🤾', '🏌️', '🏇', '🧘', '🏊', '🤽', '🚣',
      ],
    },
    {
      name: '🚗 Travel',
      emojis: [
        '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑',
        '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🦯', '🦽',
        '🦼', '🛴', '🚲', '🛵', '🏍️', '🛺', '🚨', '🚔',
        '🚍', '🚘', '🚖', '🚡', '🚠', '🚟', '🚃', '🚋',
        '🚞', '🚝', '🚄', '🚅', '🚈', '🚂', '🚆', '🚇',
        '🚊', '🚉', '✈️', '🛫', '🛬', '🪂', '💺', '🚁',
      ],
    },
    {
      name: '⌚ Objects',
      emojis: [
        '⌚', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️',
        '🖲️', '🕹️', '🗜️', '💽', '💾', '💿', '📀', '📼',
        '📷', '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️',
        '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '🧭',
        '⏱️', '⏲️', '⏰', '🕰️', '⌛', '⏳', '📡', '🔋',
        '🔌', '💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '💸',
      ],
    },
    {
      name: '🎉 Symbols',
      emojis: [
        '🎉', '🎊', '🎈', '🎁', '🎀', '🎗️', '🎟️', '🎫',
        '🎖️', '🏆', '🏅', '🥇', '🥈', '🥉', '⚽', '⚾',
        '🥎', '🏀', '🏐', '🏈', '🏉', '🎾', '🥏', '🎳',
        '🏏', '🏑', '🏒', '🥍', '🏓', '🏸', '🥊', '🥋',
        '🥅', '⛳', '⛸️', '🎣', '🤿', '🎽', '🎿', '🛷',
        '🥌', '🎯', '🪀', '🪁', '🎱', '🔮', '🪄', '🧿',
      ],
    },
    {
      name: '🏁 Flags',
      emojis: [
        '🏁', '🚩', '🎌', '🏴', '🏳️', '🏳️‍🌈', '🏳️‍⚧️', '🏴‍☠️',
        '🇺🇸', '🇬🇧', '🇨🇦', '🇦🇺', '🇩🇪', '🇫🇷', '🇪🇸', '🇮🇹',
        '🇯🇵', '🇰🇷', '🇨🇳', '🇮🇳', '🇧🇷', '🇲🇽', '🇷🇺', '🇿🇦',
      ],
    },
  ];

  const filteredEmojis = () => {
    const query = searchQuery().toLowerCase().trim();
    if (!query) {
      return emojiCategories[selectedCategory()].emojis;
    }
    
    // Simple search across all categories
    return emojiCategories
      .flatMap((cat) => cat.emojis)
      .filter((emoji, index, self) => self.indexOf(emoji) === index);
  };

  const handleEmojiClick = (emoji: string) => {
    props.onSelectEmoji(emoji);
    props.onClose();
  };

  // Parse emojis to Twemoji images
  const emojiRefs: HTMLDivElement[] = [];
  onMount(() => {
    emojiRefs.forEach((ref) => {
      if (ref) {
        twemoji.parse(ref, {
          folder: 'svg',
          ext: '.svg',
        });
      }
    });
  });

  return (
    <div class="emoji-picker-overlay" onClick={props.onClose}>
      <div class="emoji-picker" onClick={(e) => e.stopPropagation()}>
        <div class="emoji-picker-header">
          <h3>Choose an Emoji</h3>
          <button class="emoji-picker-close" onClick={props.onClose}>
            ×
          </button>
        </div>

        <div class="emoji-picker-search">
          <input
            type="text"
            placeholder="Search emojis..."
            value={searchQuery()}
            onInput={(e) => setSearchQuery(e.currentTarget.value)}
          />
        </div>

        <Show when={!searchQuery()}>
          <div class="emoji-picker-categories">
            <For each={emojiCategories}>
              {(category, index) => (
                <button
                  class="emoji-category-button"
                  classList={{ active: selectedCategory() === index() }}
                  onClick={() => setSelectedCategory(index())}
                >
                  {category.name.split(' ')[0]}
                </button>
              )}
            </For>
          </div>
        </Show>

        <div class="emoji-picker-content">
          <div class="emoji-grid">
            <For each={filteredEmojis()}>
              {(emoji) => (
                <button
                  class="emoji-item"
                  onClick={() => handleEmojiClick(emoji)}
                  ref={(el) => emojiRefs.push(el)}
                >
                  {emoji}
                </button>
              )}
            </For>
          </div>
        </div>
      </div>
    </div>
  );
};
