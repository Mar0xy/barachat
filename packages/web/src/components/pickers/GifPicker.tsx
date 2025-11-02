import { Component, createSignal, For, Show, onMount } from 'solid-js';

interface GifPickerProps {
  onSelectGif: (gifUrl: string) => void;
  onClose: () => void;
}

interface TenorGif {
  id: string;
  media_formats: {
    gif: {
      url: string;
      preview: string;
    };
    tinygif: {
      url: string;
      preview: string;
    };
  };
}

const TENOR_API_KEY = 'AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ'; // Public Tenor API key
const TENOR_CLIENT_KEY = 'barachat';

export const GifPicker: Component<GifPickerProps> = (props) => {
  const [searchQuery, setSearchQuery] = createSignal('');
  const [gifs, setGifs] = createSignal<TenorGif[]>([]);
  const [loading, setLoading] = createSignal(false);
  const [selectedCategory, setSelectedCategory] = createSignal('trending');

  const categories = [
    { id: 'trending', label: 'Trending', search: '' },
    { id: 'excited', label: 'Excited', search: 'excited' },
    { id: 'laugh', label: 'Laugh', search: 'laugh' },
    { id: 'sad', label: 'Sad', search: 'sad' },
    { id: 'love', label: 'Love', search: 'love' },
    { id: 'happy', label: 'Happy', search: 'happy' },
    { id: 'angry', label: 'Angry', search: 'angry' },
    { id: 'thumbsup', label: '👍', search: 'thumbs up' },
    { id: 'party', label: '🎉', search: 'party' },
  ];

  const fetchGifs = async (query: string = '') => {
    setLoading(true);
    try {
      let url: string;
      if (query.trim() === '') {
        // Fetch trending GIFs
        url = `https://tenor.googleapis.com/v2/featured?key=${TENOR_API_KEY}&client_key=${TENOR_CLIENT_KEY}&limit=20`;
      } else {
        // Search GIFs
        url = `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(query)}&key=${TENOR_API_KEY}&client_key=${TENOR_CLIENT_KEY}&limit=20`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      setGifs(data.results || []);
    } catch (error) {
      console.error('Error fetching GIFs:', error);
    } finally {
      setLoading(false);
    }
  };

  onMount(() => {
    fetchGifs(); // Load trending GIFs on mount
  });

  const handleSearch = () => {
    fetchGifs(searchQuery());
  };

  const handleCategoryClick = (categorySearch: string) => {
    setSearchQuery(categorySearch);
    fetchGifs(categorySearch);
  };

  const handleGifClick = (gif: TenorGif) => {
    const gifUrl = gif.media_formats.gif.url;
    props.onSelectGif(gifUrl);
    props.onClose();
  };

  return (
    <div class="gif-picker-overlay" onClick={props.onClose}>
      <div class="gif-picker" onClick={(e) => e.stopPropagation()}>
        <div class="gif-picker-header">
          <h3>Choose a GIF</h3>
          <button class="gif-picker-close" onClick={props.onClose}>
            ×
          </button>
        </div>

        <div class="gif-picker-search">
          <input
            type="text"
            placeholder="Search for GIFs..."
            value={searchQuery()}
            onInput={(e) => setSearchQuery(e.currentTarget.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
          />
          <button onClick={handleSearch}>Search</button>
        </div>

        <div class="gif-picker-categories">
          <For each={categories}>
            {(category) => (
              <button
                class="gif-category-button"
                classList={{ active: selectedCategory() === category.id }}
                onClick={() => {
                  setSelectedCategory(category.id);
                  handleCategoryClick(category.search);
                }}
              >
                {category.label}
              </button>
            )}
          </For>
        </div>

        <div class="gif-picker-content">
          <Show when={loading()}>
            <div class="gif-picker-loading">Loading GIFs...</div>
          </Show>
          <Show when={!loading() && gifs().length === 0}>
            <div class="gif-picker-empty">No GIFs found</div>
          </Show>
          <div class="gif-grid">
            <For each={gifs()}>
              {(gif) => (
                <div class="gif-item" onClick={() => handleGifClick(gif)}>
                  <img
                    src={gif.media_formats.tinygif?.url || gif.media_formats.gif.url}
                    alt="GIF"
                    loading="lazy"
                  />
                </div>
              )}
            </For>
          </div>
        </div>

        <div class="gif-picker-footer">
          <span>Powered by Tenor</span>
        </div>
      </div>
    </div>
  );
};
