import { Component, Show, For } from 'solid-js';
import { Message, User } from '../types';

interface MessageItemProps {
  message: Message;
  currentUser: User | null;
  isServerOwner?: boolean;
  onDelete: (messageId: string) => void;
  onImageClick: (url: string) => void;
  onUserClick?: (userId: string) => void;
}

export const MessageItem: Component<MessageItemProps> = (props) => {
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const extractUrls = (text: string): string[] => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.match(urlRegex) || [];
  };

  const isEmbeddableUrl = (url: string): boolean => {
    return (
      url.includes('tenor.com') ||
      /\.(gif|jpg|jpeg|png|webp)(\?|$)/i.test(url)
    );
  };

  const extractYouTubeId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const isYouTubeUrl = (url: string): boolean => {
    return extractYouTubeId(url) !== null;
  };

  const isVideoUrl = (url: string): boolean => {
    return /\.(mp4|webm|mov)(\?|$)/i.test(url);
  };

  return (
    <div
      class="message"
      classList={{ 'own-message': props.message.author._id === props.currentUser?._id }}
    >
      <div
        class="message-avatar"
        classList={{ clickable: !!props.onUserClick }}
        onClick={() => props.onUserClick?.(props.message.author._id)}
        style={{ cursor: props.onUserClick ? 'pointer' : 'default' }}
      >
        {props.message.author.avatar ? (
          <img src={props.message.author.avatar} alt={props.message.author.username} />
        ) : (
          <div class="avatar-placeholder">
            {(props.message.author.displayName || props.message.author.username)
              .charAt(0)
              .toUpperCase()}
          </div>
        )}
      </div>
      <div class="message-content-wrapper">
        <div class="message-header">
          <span
            class="message-author"
            classList={{ clickable: !!props.onUserClick }}
            onClick={() => props.onUserClick?.(props.message.author._id)}
            style={{ cursor: props.onUserClick ? 'pointer' : 'default' }}
          >
            {props.message.author.displayName || props.message.author.username}
          </span>
          <span class="message-timestamp">
            {formatTimestamp(props.message.createdAt || new Date().toISOString())}
          </span>
          <Show when={props.message.author._id === props.currentUser?._id || props.isServerOwner}>
            <button
              class="delete-message"
              onClick={() => props.onDelete(props.message._id)}
              title="Delete message"
            >
              🗑️
            </button>
          </Show>
        </div>
        <div class="message-content">{props.message.content}</div>
        
        {/* Auto-embed URLs found in message content */}
        <Show when={props.message.content}>
          {/* YouTube embeds */}
          <For each={extractUrls(props.message.content).filter(isYouTubeUrl)}>
            {(url) => {
              const videoId = extractYouTubeId(url);
              return (
                <div class="message-embed video-embed">
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}`}
                    title="YouTube video player"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowfullscreen
                  />
                </div>
              );
            }}
          </For>

          {/* Video file embeds */}
          <For each={extractUrls(props.message.content).filter(isVideoUrl)}>
            {(url) => (
              <div class="message-embed video-embed">
                <video controls>
                  <source src={url} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            )}
          </For>

          {/* Image/GIF embeds */}
          <For each={extractUrls(props.message.content).filter(isEmbeddableUrl)}>
            {(url) => (
              <div class="message-embed">
                <img
                  src={url}
                  alt="embedded content"
                  class="message-image"
                  onClick={() => props.onImageClick(url)}
                />
              </div>
            )}
          </For>
        </Show>

        <Show when={props.message.attachments && props.message.attachments.length > 0}>
          <div class="message-attachments">
            <For each={props.message.attachments}>
              {(attachment) => {
                const isVideo = typeof attachment === 'string' && /\.(mp4|webm|mov)(\?|$)/i.test(attachment);
                return isVideo ? (
                  <div class="message-embed video-embed">
                    <video controls>
                      <source src={attachment} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                ) : (
                  <img
                    src={attachment}
                    alt="attachment"
                    class="message-image"
                    onClick={() => props.onImageClick(attachment)}
                  />
                );
              }}
            </For>
          </div>
        </Show>
      </div>
    </div>
  );
};
