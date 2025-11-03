import { API_URL } from '../utils/constants';
import { User, Server, Channel, Message, Friend, Member } from '../types';

const getToken = () => localStorage.getItem('token');

const getAuthHeaders = () => ({
  Authorization: `Bearer ${getToken()}`
});

const getJsonHeaders = () => ({
  'Content-Type': 'application/json',
  ...getAuthHeaders()
});

// User API
export const userApi = {
  async getMe(): Promise<User | null> {
    try {
      const response = await fetch(`${API_URL}/users/@me`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const userData = await response.json();
        if (!userData.status) {
          userData.status = { presence: 'Online', text: '' };
        }
        return userData;
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
    return null;
  },

  async getUser(userId: string): Promise<User | null> {
    try {
      const response = await fetch(`${API_URL}/users/${userId}`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
    return null;
  }
};

// Server API
export const serverApi = {
  async getServers(): Promise<Server[]> {
    try {
      const response = await fetch(`${API_URL}/users/@me/servers`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const serverData = await response.json();
        return serverData.map((server: any) => ({
          ...server,
          name: typeof server.name === 'string' ? server.name : String(server.name || 'Unnamed Server')
        }));
      }
    } catch (error) {
      console.error('Error loading servers:', error);
    }
    return [];
  },

  async createServer(name: string, description: string): Promise<Server | null> {
    try {
      const response = await fetch(`${API_URL}/servers/create`, {
        method: 'POST',
        headers: getJsonHeaders(),
        body: JSON.stringify({ name, description })
      });
      if (response.ok) {
        const server = await response.json();
        return {
          ...server,
          name: typeof server.name === 'string' ? server.name : String(server.name || 'Unnamed Server')
        };
      }
    } catch (error) {
      console.error('Error creating server:', error);
    }
    return null;
  },

  async getMembers(serverId: string): Promise<Member[]> {
    try {
      const response = await fetch(`${API_URL}/servers/${serverId}/members`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error loading members:', error);
    }
    return [];
  }
};

// Channel API
export const channelApi = {
  async getChannels(serverId: string): Promise<Channel[]> {
    try {
      const response = await fetch(`${API_URL}/servers/${serverId}/channels`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error loading channels:', error);
    }
    return [];
  },

  async getDMChannels(): Promise<any[]> {
    try {
      const response = await fetch(`${API_URL}/users/@me/channels`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error loading DM channels:', error);
    }
    return [];
  },

  async createDM(userId: string): Promise<any | null> {
    try {
      const response = await fetch(`${API_URL}/channels/create-dm`, {
        method: 'POST',
        headers: getJsonHeaders(),
        body: JSON.stringify({ userId })
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error creating DM:', error);
    }
    return null;
  },

  async updateChannel(channelId: string, name: string, category?: string): Promise<Channel | null> {
    try {
      const response = await fetch(`${API_URL}/channels/${channelId}`, {
        method: 'PATCH',
        headers: getJsonHeaders(),
        body: JSON.stringify({ name, category: category || null })
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error updating channel:', error);
    }
    return null;
  },

  async deleteChannel(channelId: string, serverId?: string, deleteChannels?: boolean): Promise<boolean> {
    try {
      let url = `${API_URL}/channels/${channelId}`;
      if (serverId && deleteChannels !== undefined) {
        url = `${API_URL}/servers/${serverId}/categories/${channelId}?deleteChannels=${deleteChannels}`;
      }

      const response = await fetch(url, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return response.ok;
    } catch (error) {
      console.error('Error deleting channel:', error);
      return false;
    }
  }
};

// Message API
export const messageApi = {
  async getMessages(channelId: string): Promise<Message[]> {
    try {
      const response = await fetch(`${API_URL}/channels/${channelId}/messages`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
    return [];
  },

  async sendMessage(channelId: string, content: string, attachments: string[]): Promise<Message | null> {
    try {
      const response = await fetch(`${API_URL}/channels/${channelId}/messages`, {
        method: 'POST',
        headers: getJsonHeaders(),
        body: JSON.stringify({ content, attachments })
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
    return null;
  },

  async deleteMessage(channelId: string, messageId: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/channels/${channelId}/messages/${messageId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return response.ok;
    } catch (error) {
      console.error('Error deleting message:', error);
      return false;
    }
  }
};

// Friend API
export const friendApi = {
  async getFriends(): Promise<Friend[]> {
    try {
      const response = await fetch(`${API_URL}/users/@me/friends`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error loading friends:', error);
    }
    return [];
  }
};

// Upload API
export const uploadApi = {
  async uploadAttachment(file: File): Promise<string | null> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_URL}/upload/attachment`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        return data.url;
      }
    } catch (error) {
      console.error('Error uploading attachment:', error);
    }
    return null;
  }
};
