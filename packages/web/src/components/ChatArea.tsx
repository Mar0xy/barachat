import { Component, For, Show, createEffect } from 'solid-js';
import { Message, User } from '../types';

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
}

export const ChatArea: Component<ChatAreaProps> = (props) => {
  let messagesEndRef: HTMLDivElement | undefined;
  
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
  
  return (
    <div class="chat-area">
      <Show when={props.currentChannel} fallback={
        <div class="no-channel-selected">
          Select a channel to start chatting
        </div>
      }>
        <div class="messages">
          <For each={props.messages}>
            {(message) => (
              <div class="message" classList={{ 'own-message': message.author._id === props.user?._id }}>
                <div class="message-avatar">
                  {message.author.avatar ? (
                    <img src={message.author.avatar} alt={message.author.username} />
                  ) : (
                    <div class="avatar-placeholder">
                      {(message.author.displayName || message.author.username).charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div class="message-content">
                  <div class="message-header">
                    <span class="message-author">
                      {message.author.displayName || message.author.username}
                    </span>
                    <span class="message-timestamp">
                      {formatTimestamp(message.createdAt || new Date().toISOString())}
                    </span>
                    <Show when={message.author._id === props.user?._id}>
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
              <button class="clear-all-attachments" onClick={props.onClearAttachments}>Clear all</button>
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
          <button
            class="attach-button"
            onClick={() => props.fileInputRef?.click()}
            disabled={props.uploadingAttachment}
            title="Attach image"
          >
            {props.uploadingAttachment ? '⏳' : '📎'}
          </button>
          <textarea
            class="message-input"
            placeholder="Message #general"
            value={props.messageInput}
            onInput={(e) => props.onMessageInputChange(e.currentTarget.value)}
            onKeyDown={handleKeyDown}
            onKeyPress={props.onTyping}
          />
        </div>
      </Show>
      
      <Show when={props.lightboxImage()}>
        <div class="lightbox" onClick={props.onLightboxClose}>
          <div class="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img src={props.lightboxImage()!} alt="Full size" />
            <button class="lightbox-close" onClick={props.onLightboxClose}>×</button>
          </div>
        </div>
      </Show>
    </div>
  );
};
