import { Component, For, Show } from 'solid-js';
import { Member } from '../types';

interface MembersListProps {
  members: Member[];
  onMemberClick?: (userId: string) => void;
}

export const MembersList: Component<MembersListProps> = (props) => {
  const onlineMembers = () => props.members.filter(m => m.online);
  const offlineMembers = () => props.members.filter(m => !m.online);

  const getPresenceClass = (member: Member) => {
    if (!member.online || !member.user?.status?.presence || member.user.status.presence === 'Invisible') {
      return 'offline';
    }
    
    switch (member.user.status.presence) {
      case 'Online':
        return 'online';
      case 'Idle':
        return 'idle';
      case 'Busy':
        return 'dnd';
      default:
        return 'offline';
    }
  };

  return (
    <div class="members-list">
      <Show when={onlineMembers().length > 0}>
        <div class="members-section">
          <h4>Online — {onlineMembers().length}</h4>
          <For each={onlineMembers()}>
            {(member) => (
              <div 
                class="member-item" 
                onClick={() => props.onMemberClick?.(member.user._id)}
              >
                <div class="member-avatar-wrapper">
                  {member.user.avatar ? (
                    <img src={member.user.avatar} alt={member.user.username} class="member-avatar" />
                  ) : (
                    <div class="member-avatar member-avatar-placeholder">
                      {member.user.username[0].toUpperCase()}
                    </div>
                  )}
                  <div class={`member-status-indicator ${getPresenceClass(member)}`} />
                </div>
                <div class="member-name">
                  {member.nickname || member.user.displayName || member.user.username}
                </div>
              </div>
            )}
          </For>
        </div>
      </Show>

      <Show when={offlineMembers().length > 0}>
        <div class="members-section">
          <h4>Offline — {offlineMembers().length}</h4>
          <For each={offlineMembers()}>
            {(member) => (
              <div 
                class="member-item offline-member" 
                onClick={() => props.onMemberClick?.(member.user._id)}
              >
                <div class="member-avatar-wrapper">
                  {member.user.avatar ? (
                    <img src={member.user.avatar} alt={member.user.username} class="member-avatar" />
                  ) : (
                    <div class="member-avatar member-avatar-placeholder">
                      {member.user.username[0].toUpperCase()}
                    </div>
                  )}
                  <div class={`member-status-indicator ${getPresenceClass(member)}`} />
                </div>
                <div class="member-name">
                  {member.nickname || member.user.displayName || member.user.username}
                </div>
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
};
