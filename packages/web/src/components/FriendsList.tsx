import { Component, For, Show, createSignal } from 'solid-js';
import { Friend, User } from '../types';
import { API_URL } from '../utils/constants';

interface FriendsListProps {
  friends: Friend[];
  onFriendSelect?: (friendId: string) => void;
  onRefresh: () => void;
}

export const FriendsList: Component<FriendsListProps> = (props) => {
  const [showAddFriend, setShowAddFriend] = createSignal(false);
  const [searchQuery, setSearchQuery] = createSignal('');
  const [searchResults, setSearchResults] = createSignal<User[]>([]);
  const [searching, setSearching] = createSignal(false);

  const searchUsers = async () => {
    const query = searchQuery().trim();
    if (!query) return;

    setSearching(true);
    const token = localStorage.getItem('token');
    
    try {
      // Search for users by username
      const response = await fetch(`${API_URL}/users/search?q=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const results = await response.json();
        setSearchResults(results);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearching(false);
    }
  };

  const sendFriendRequest = async (userId: string) => {
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`${API_URL}/users/@me/relationships/${userId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        alert('Friend request sent!');
        setShowAddFriend(false);
        setSearchQuery('');
        setSearchResults([]);
        props.onRefresh();
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };

  const acceptFriendRequest = async (userId: string) => {
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`${API_URL}/users/@me/relationships/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'accept' })
      });
      
      if (response.ok) {
        props.onRefresh();
      }
    } catch (error) {
      console.error('Error accepting friend request:', error);
    }
  };

  const rejectFriendRequest = async (userId: string) => {
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`${API_URL}/users/@me/relationships/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'reject' })
      });
      
      if (response.ok) {
        props.onRefresh();
      }
    } catch (error) {
      console.error('Error rejecting friend request:', error);
    }
  };

  const removeFriend = async (userId: string) => {
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`${API_URL}/users/@me/relationships/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        props.onRefresh();
      }
    } catch (error) {
      console.error('Error removing friend:', error);
    }
  };

  const pendingRequests = () => props.friends.filter(f => f.relationshipStatus === 'pending');
  const acceptedFriends = () => props.friends.filter(f => f.relationshipStatus === 'accepted');

  return (
    <div class="friends-list">
      <div class="friends-header">
        <h3>Friends</h3>
        <button class="button-primary" onClick={() => setShowAddFriend(true)}>
          Add Friend
        </button>
      </div>

      <Show when={pendingRequests().length > 0}>
        <div class="friends-section">
          <h4>Pending Requests</h4>
          <For each={pendingRequests()}>
            {(friend) => (
              <div class="friend-item pending">
                <div class="friend-avatar">
                  {friend.avatar ? (
                    <img src={friend.avatar} alt={friend.username} />
                  ) : (
                    <div class="avatar-placeholder">
                      {friend.username[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <div class="friend-info">
                  <div class="friend-name">
                    {friend.displayName || friend.username}
                  </div>
                  <div class="friend-username">
                    {friend.username}#{friend.discriminator}
                  </div>
                </div>
                <div class="friend-actions">
                  <button class="button-primary" onClick={() => acceptFriendRequest(friend._id)}>
                    Accept
                  </button>
                  <button class="button-secondary" onClick={() => rejectFriendRequest(friend._id)}>
                    Reject
                  </button>
                </div>
              </div>
            )}
          </For>
        </div>
      </Show>

      <div class="friends-section">
        <h4>All Friends — {acceptedFriends().length}</h4>
        <For each={acceptedFriends()}>
          {(friend) => (
            <div class="friend-item" onClick={() => props.onFriendSelect?.(friend._id)}>
              <div class="friend-avatar">
                {friend.avatar ? (
                  <img src={friend.avatar} alt={friend.username} />
                ) : (
                  <div class="avatar-placeholder">
                    {friend.username[0].toUpperCase()}
                  </div>
                )}
                <div class="status-indicator" classList={{ online: friend.online }} />
              </div>
              <div class="friend-info">
                <div class="friend-name">
                  {friend.displayName || friend.username}
                </div>
                <div class="friend-username">
                  {friend.online ? 'Online' : 'Offline'}
                </div>
              </div>
              <div class="friend-actions">
                <button class="icon-button" title="Message">
                  💬
                </button>
                <button class="icon-button" onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Remove friend?')) {
                    removeFriend(friend._id);
                  }
                }} title="Remove Friend">
                  ❌
                </button>
              </div>
            </div>
          )}
        </For>
      </div>

      <Show when={showAddFriend()}>
        <div class="modal-overlay" onClick={() => setShowAddFriend(false)}>
          <div class="modal" onClick={(e) => e.stopPropagation()}>
            <div class="modal-header">
              <h2>Add Friend</h2>
              <button class="modal-close" onClick={() => setShowAddFriend(false)}>×</button>
            </div>
            <div class="modal-body">
              <label>
                Search by username
                <div style={{ display: 'flex', gap: '8px', 'margin-top': '8px' }}>
                  <input
                    type="text"
                    value={searchQuery()}
                    onInput={(e) => setSearchQuery(e.currentTarget.value)}
                    placeholder="username#0000"
                    style={{ flex: 1 }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        searchUsers();
                      }
                    }}
                  />
                  <button class="button-primary" onClick={searchUsers} disabled={searching()}>
                    {searching() ? 'Searching...' : 'Search'}
                  </button>
                </div>
              </label>

              <Show when={searchResults().length > 0}>
                <div class="search-results" style={{ 'margin-top': '16px' }}>
                  <h4>Search Results</h4>
                  <For each={searchResults()}>
                    {(user) => (
                      <div class="friend-item">
                        <div class="friend-avatar">
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.username} />
                          ) : (
                            <div class="avatar-placeholder">
                              {user.username[0].toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div class="friend-info">
                          <div class="friend-name">
                            {user.displayName || user.username}
                          </div>
                          <div class="friend-username">
                            {user.username}#{user.discriminator}
                          </div>
                        </div>
                        <button class="button-primary" onClick={() => sendFriendRequest(user._id)}>
                          Add Friend
                        </button>
                      </div>
                    )}
                  </For>
                </div>
              </Show>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
};
