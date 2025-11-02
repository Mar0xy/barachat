import { Component, For, Show, createEffect, createSignal } from 'solid-js';
import { Message, User } from '../types';
import { GifPicker } from './pickers/GifPicker';
import { EmojiPicker } from './pickers/EmojiPicker';

interface ChatAreaProps {
  messages: Message[];
  currentChannel: string;
  messageInput: string;
  onMessageInputChange: (value: string) => void;
  onSendMessage: () => void;
  onDeleteMessage: (messageId: string) => void;
  onTyping: () => void;
  user: User | null;
  typingText: () => string;
  lightboxImage: () => string | null;
  onLightboxClose: () => void;
  onImageClick: (url: string) => void;
  pendingAttachments: string[];
  onRemoveAttachment: (url: string) => void;
  onClearAttachments: () => void;
  uploadingAttachment: boolean;
  onAttachmentUpload: (files: FileList | null) => void;
  fileInputRef?: HTMLInputElement;
  messagePlaceholder?: string;
  onUserClick?: (userId: string) => void;
  isServerOwner?: boolean;
}

export const ChatArea: Component<ChatAreaProps> = (props) => {
  let messagesEndRef: HTMLDivElement | undefined;
  const [showGifPicker, setShowGifPicker] = createSignal(false);
  const [showEmojiPicker, setShowEmojiPicker] = createSignal(false);

  createEffect(() => {
    if (messagesEndRef) {
      messagesEndRef.scrollIntoView({ behavior: 'smooth' });
    }
  });

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      props.onSendMessage();
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  // Extract URLs from message content for auto-embedding
  const extractUrls = (text: string): string[] => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.match(urlRegex) || [];
  };

  // Check if URL is an embeddable image/GIF
  const isEmbeddableUrl = (url: string): boolean => {
    // Support Tenor GIFs and common image formats
    return (
      url.includes('tenor.com') ||
      /\.(gif|jpg|jpeg|png|webp)(\?|$)/i.test(url)
    );
  };

  const handleGifSelect = (gifUrl: string) => {
    // Insert GIF URL into message content
    props.onMessageInputChange(props.messageInput + gifUrl + ' ');
    setShowGifPicker(false);
  };

  const handleEmojiSelect = (emoji: string) => {
    // Insert emoji at cursor position or append to end
    props.onMessageInputChange(props.messageInput + emoji);
    setShowEmojiPicker(false);
  };

  return (
    <div class="chat-area">
      <Show
        when={props.currentChannel}
        fallback={<div class="no-channel-selected">Select a channel to start chatting</div>}
      >
        <div class="messages">
          <For each={props.messages}>
            {(message) => (
              <div
                class="message"
                classList={{ 'own-message': message.author._id === props.user?._id }}
              >
                <div
                  class="message-avatar"
                  classList={{ clickable: !!props.onUserClick }}
                  onClick={() => props.onUserClick?.(message.author._id)}
                  style={{ cursor: props.onUserClick ? 'pointer' : 'default' }}
                >
                  {message.author.avatar ? (
                    <img src={message.author.avatar} alt={message.author.username} />
                  ) : (
                    <div class="avatar-placeholder">
                      {(message.author.displayName || message.author.username)
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  )}
                </div>
                <div class="message-content">
                  <div class="message-header">
                    <span
                      class="message-author"
                      classList={{ clickable: !!props.onUserClick }}
                      onClick={() => props.onUserClick?.(message.author._id)}
                      style={{ cursor: props.onUserClick ? 'pointer' : 'default' }}
                    >
                      {message.author.displayName || message.author.username}
                    </span>
                    <span class="message-timestamp">
                      {formatTimestamp(message.createdAt || new Date().toISOString())}
                    </span>
                    <Show when={message.author._id === props.user?._id || props.isServerOwner}>
                      <button
                        class="delete-message"
                        onClick={() => props.onDeleteMessage(message._id)}
                        title="Delete message"
                      >
                        🗑️
                      </button>
                    </Show>
                  </div>
                  <div class="message-text">{message.content}</div>
                  
                  {/* Auto-embed URLs found in message content */}
                  <Show when={message.content}>
                    <For each={extractUrls(message.content).filter(isEmbeddableUrl)}>
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

                  <Show when={message.attachments && message.attachments.length > 0}>
                    <div class="message-attachments">
                      <For each={message.attachments}>
                        {(attachment) => (
                          <img
                            src={attachment}
                            alt="attachment"
                            class="message-image"
                            onClick={() => props.onImageClick(attachment)}
                          />
                        )}
                      </For>
                    </div>
                  </Show>
                </div>
              </div>
            )}
          </For>
          <div ref={messagesEndRef} />
        </div>

        <Show when={props.typingText()}>
          <div class="typing-indicator">{props.typingText()}</div>
        </Show>

        <Show when={props.pendingAttachments.length > 0}>
          <div class="pending-attachments-wrapper">
            <div class="pending-attachments-header">
              <span>Attachments ({props.pendingAttachments.length})</span>
              <button class="clear-all-attachments" onClick={props.onClearAttachments}>
                Clear all
              </button>
            </div>
            <div class="pending-attachments">
              <For each={props.pendingAttachments}>
                {(attachment) => (
                  <div class="pending-attachment">
                    <img src={attachment} alt="pending" />
                    <button
                      class="remove-attachment"
                      onClick={() => props.onRemoveAttachment(attachment)}
                    >
                      ×
                    </button>
                  </div>
                )}
              </For>
            </div>
          </div>
        </Show>

        <div class="message-input-container">
          <input
            type="file"
            ref={props.fileInputRef}
            style="display: none"
            multiple
            accept="image/*"
            onChange={(e) => props.onAttachmentUpload(e.target.files)}
          />
          <div class="picker-buttons">
            <button
              class="attach-button"
              onClick={() => props.fileInputRef?.click()}
              disabled={props.uploadingAttachment}
              title="Attach image"
            >
              {props.uploadingAttachment ? '⏳' : '📎'}
            </button>
            <button
              class="picker-button"
              onClick={() => setShowGifPicker(true)}
              title="Choose a GIF"
            >
              GIF
            </button>
            <button
              class="picker-button"
              onClick={() => setShowEmojiPicker(true)}
              title="Choose an emoji"
            >
              😀
            </button>
          </div>
          <textarea
            class="message-input"
            placeholder={props.messagePlaceholder || 'Message #general'}
            value={props.messageInput}
            onInput={(e) => props.onMessageInputChange(e.currentTarget.value)}
            onKeyDown={handleKeyDown}
            onKeyPress={props.onTyping}
          />
        </div>
      </Show>

      <Show when={showGifPicker()}>
        <GifPicker onSelectGif={handleGifSelect} onClose={() => setShowGifPicker(false)} />
      </Show>

      <Show when={showEmojiPicker()}>
        <EmojiPicker onSelectEmoji={handleEmojiSelect} onClose={() => setShowEmojiPicker(false)} />
      </Show>

      <Show when={props.lightboxImage()}>
        <div class="lightbox" onClick={props.onLightboxClose}>
          <div class="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img src={props.lightboxImage()!} alt="Full size" />
            <button class="lightbox-close" onClick={props.onLightboxClose}>
              ×
            </button>
          </div>
        </div>
      </Show>
    </div>
  );
};
