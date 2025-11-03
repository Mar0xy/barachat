import { Component, For, Show, createEffect, createSignal } from 'solid-js';
import { Message, User } from '../types';
import { GifPicker } from './pickers/GifPicker';
import { EmojiPicker } from './pickers/EmojiPicker';
import { MessageItem } from './MessageItem';

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

  const handleGifSelect = (gifUrl: string) => {
    props.onMessageInputChange(props.messageInput + gifUrl + ' ');
    setShowGifPicker(false);
  };

  const handleEmojiSelect = (emoji: string) => {
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
              <MessageItem
                message={message}
                currentUser={props.user}
                isServerOwner={props.isServerOwner}
                onDelete={props.onDeleteMessage}
                onImageClick={props.onImageClick}
                onUserClick={props.onUserClick}
              />
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
                {(attachment) => {
                  const isVideo = /\.(mp4|webm|mov)(\?|$)/i.test(attachment);
                  return (
                    <div class="pending-attachment">
                      {isVideo ? (
                        <video width="100" height="100">
                          <source src={attachment} type="video/mp4" />
                        </video>
                      ) : (
                        <img src={attachment} alt="pending" />
                      )}
                      <button
                        class="remove-attachment"
                        onClick={() => props.onRemoveAttachment(attachment)}
                      >
                        ×
                      </button>
                    </div>
                  );
                }}
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
            accept="image/*,video/mp4,video/webm"
            onChange={(e) => props.onAttachmentUpload(e.target.files)}
          />
          <div class="message-input-wrapper">
            <textarea
              class="message-input"
              placeholder={props.messagePlaceholder || 'Message #general'}
              value={props.messageInput}
              onInput={(e) => props.onMessageInputChange(e.currentTarget.value)}
              onKeyDown={handleKeyDown}
              onKeyPress={props.onTyping}
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
          </div>
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
