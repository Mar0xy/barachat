import { Component, For } from 'solid-js';
import { Server } from '../types';

interface ServerListProps {
  servers: Server[];
  currentServer: string;
  onServerSelect: (serverId: string) => void;
  onCreateServer: () => void;
}

export const ServerList: Component<ServerListProps> = (props) => {
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
        {(server) => (
          <button
            class="server-item"
            classList={{ active: props.currentServer === server._id }}
            onClick={() => props.onServerSelect(server._id)}
            title={server.name}
          >
            {server.icon ? (
              <img src={server.icon} alt={server.name} />
            ) : (
              <div class="server-acronym">
                {String(server.name || '')
                  .split(' ')
                  .map((word) => word[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)}
              </div>
            )}
          </button>
        )}
      </For>
      
      <button class="server-item add-server" onClick={props.onCreateServer} title="Add Server">
        +
      </button>
    </div>
  );
};
