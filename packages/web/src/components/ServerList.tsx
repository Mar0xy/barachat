import { Component, For } from 'solid-js';
import { Server } from '../types';

interface ServerListProps {
  servers: Server[];
  currentServer: string;
  onServerSelect: (serverId: string) => void;
  onCreateServer: () => void;
}

export const ServerList: Component<ServerListProps> = (props) => {
  const getServerName = (server: Server): string => {
    if (typeof server.name === 'string') {
      return server.name;
    }
    // If name is an object or other type, return empty string
    return '';
  };

  return (
    <div class="server-list">
      <button
        class="server-item home-button"
        classList={{ active: !props.currentServer }}
        onClick={() => props.onServerSelect('')}
        title="Home"
      >
        🏠
      </button>
      
      <div class="server-separator" />
      
      <For each={props.servers}>
        {(server) => {
          const serverName = getServerName(server);
          const acronym = serverName
            ? serverName.split(' ')
                .filter(word => word.length > 0)
                .map((word) => word[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)
            : '??';
          
          return (
            <button
              class="server-item"
              classList={{ active: props.currentServer === server._id }}
              onClick={() => props.onServerSelect(server._id)}
              title={serverName || 'Server'}
            >
              {server.icon ? (
                <img src={server.icon} alt={serverName || 'Server'} />
              ) : (
                <div class="server-acronym">
                  {acronym || '??'}
                </div>
              )}
            </button>
          );
        }}
      </For>
      
      <button class="server-item add-server" onClick={props.onCreateServer} title="Add Server">
        +
      </button>
    </div>
  );
};
