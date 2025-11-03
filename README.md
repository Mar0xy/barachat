# Barachat

<div align="center">

A modern chat platform built with TypeScript

[![License](https://img.shields.io/badge/license-AGPL--3.0-blue)](LICENSE)

</div>

## Overview

Barachat is a modern, self-hosted chat platform built with TypeScript. It's inspired by platforms like Revolt and Discord, featuring real-time messaging, servers, channels, and direct messages. The project is structured as a monorepo with separate packages for the API, WebSocket server, web frontend, and shared components.

### Key Features

- **REST API Server** - Express-based API for authentication, user management, servers, channels, and messages
- **WebSocket Server** - Real-time bidirectional communication for instant message delivery and presence updates
- **Web Frontend** - Modern, responsive web client built with Solid.js and TypeScript
- **Database Layer** - MongoDB for data persistence and Redis for caching and pub/sub messaging
- **Modular Architecture** - Organized as a pnpm monorepo with clearly separated packages and concerns
- **Modular CSS** - Well-organized, component-specific stylesheets for maintainability
- **Docker Support** - Full Docker Compose setup for easy deployment with nginx reverse proxy

## Architecture

This project is a monorepo containing the following packages:

| Package | Description | Key Technologies |
|---------|-------------|------------------|
| `@barachat/models` | Core data models and type definitions | TypeScript interfaces and enums |
| `@barachat/config` | Configuration management and environment variables | dotenv |
| `@barachat/database` | Database layer with MongoDB and Redis clients | MongoDB driver, Redis client |
| `@barachat/api` | REST API server | Express, JWT, bcrypt |
| `@barachat/websocket` | WebSocket events server for real-time communication | ws library |
| `@barachat/web` | Web frontend application | Solid.js, Vite |

## Prerequisites

Before getting started, ensure you have:

- **Node.js** >= 18 (v20 recommended)
- **pnpm** >= 8 (enable with `corepack enable`)
- **Docker** and **Docker Compose** (for databases or production deployment)
- **Git**

## Quick Start

You can run Barachat in two ways: **Development Mode** (with hot-reload) or **Production Mode** (using Docker).

### Production Mode (Docker - Recommended)

This mode runs everything in Docker containers with a single command. All services are networked together, and only port 8080 is exposed.

#### 1. Clone the repository

```bash
git clone https://github.com/Mar0xy/barachat.git
cd barachat
```

#### 2. Set up environment (optional)

```bash
# Copy and customize environment file if needed
cp .env.example .env
# Edit .env to set JWT_SECRET and other variables
```

#### 3. Start all services with Docker Compose

```bash
docker compose up -d
```

This will:
- Pull pre-built images from GitHub Container Registry (GHCR)
- Start the API server, WebSocket server, and web frontend
- Start MongoDB and Redis (no external ports exposed)
- Set up an internal network for all services
- Expose only port 8080 through an nginx reverse proxy

> **Note:** By default, `docker-compose.yml` uses pre-built images from GHCR. If you want to build images locally instead, see [DOCKER.md](DOCKER.md) for instructions.

The application will be available at: **http://localhost:8080**

- Frontend: `http://localhost:8080/`
- API: `http://localhost:8080/api/`
- WebSocket: `ws://localhost:8080/ws`

#### 4. View logs

```bash
# View all logs
docker compose logs -f

# View specific service logs
docker compose logs -f api
docker compose logs -f websocket
docker compose logs -f web
```

#### 5. Stop services

```bash
docker compose down

# Or to remove volumes as well (deletes all data)
docker compose down -v
```

### Development Mode (Local)

This mode runs services locally with hot-reload for faster development iteration.

#### Prerequisites for Development Mode
- **Node.js** >= 18 (v20 recommended)
- **pnpm** >= 8 (enable with `corepack enable`)
- **Docker** and **Docker Compose** (for running MongoDB and Redis)
- **Git**

#### 1. Clone the repository

```bash
git clone https://github.com/Mar0xy/barachat.git
cd barachat
```

#### 2. Install dependencies

```bash
pnpm install
```

#### 3. Set up environment

```bash
# Copy environment files
cp .env.example .env
cp packages/web/.env.example packages/web/.env

# Start databases (MongoDB and Redis)
docker compose up -d mongodb redis
```

#### 4. Build dependencies

```bash
pnpm build:deps
```

#### 5. Start the development servers

**Option A: Use the start script (recommended)**

```bash
# This will start all services together
./start.sh
```

Press `Ctrl+C` to stop all services. The script will automatically clean up all background processes.

**Option B: Run services separately**

Open three terminal windows:

```bash
# Terminal 1: Start API server
pnpm dev:api

# Terminal 2: Start WebSocket server
pnpm dev:ws

# Terminal 3: Start web frontend
pnpm dev:web
```

The application will be available at:
- **Web Frontend**: http://localhost:5173
- **API Server**: http://localhost:3000
- **WebSocket Server**: ws://localhost:3001

### Stopping Services

**Docker Mode:**
```bash
docker compose down
```

**Development Mode:**
When using the start script, simply press `Ctrl+C` and all services will be stopped automatically.

If running services separately, press `Ctrl+C` in each terminal window.

If you need to manually stop all Node.js processes (e.g., if a process gets stuck):
```bash
# List all Node.js processes
ps aux | grep node

# Kill specific process by PID
kill <PID>
```

## Development

### Project Structure

```
barachat/
├── packages/
│   ├── models/          # Shared TypeScript types and interfaces
│   │   └── src/
│   │       ├── index.ts       # Core models (User, Server, Channel, Message, etc.)
│   │       └── events.ts      # WebSocket event types
│   ├── config/          # Configuration management
│   │   └── src/index.ts       # Environment variable handling
│   ├── database/        # Database abstraction layer
│   │   └── src/index.ts       # MongoDB and Redis clients, collections
│   ├── api/             # REST API server
│   │   └── src/
│   │       ├── index.ts       # Express server setup
│   │       ├── middleware/    # Authentication middleware
│   │       └── routes/        # API route handlers
│   ├── websocket/       # WebSocket server
│   │   └── src/index.ts       # WebSocket connection handling, event broadcasting
│   └── web/             # Web frontend
│       └── src/
│           ├── components/    # Solid.js components
│           │   ├── modals/   # Modal dialogs (user/server settings, create channel, etc.)
│           │   └── pickers/  # GIF and Emoji pickers
│           ├── styles/        # Modular CSS files organized by component
│           │   ├── base.css       # Base styles and resets
│           │   ├── buttons.css    # Button variants
│           │   ├── chat.css       # Chat area and messages
│           │   ├── sidebar.css    # Channel list sidebar
│           │   ├── modals.css     # Modal base styles
│           │   └── ...           # Other component-specific styles
│           ├── utils/         # API client, constants
│           ├── App.tsx        # Component exports
│           └── index.tsx      # Application entry point
├── docker-compose.yml   # Docker services configuration
├── Dockerfile.api       # API server container
├── Dockerfile.websocket # WebSocket server container
├── Dockerfile.web       # Web frontend container
├── nginx-proxy.conf     # Reverse proxy configuration
├── package.json         # Root package.json with workspace scripts
└── pnpm-workspace.yaml  # pnpm workspace configuration
```

### Available Scripts

```bash
# Development
pnpm dev:api        # Run API server in dev mode
pnpm dev:ws         # Run WebSocket server in dev mode
pnpm dev:web        # Run web frontend in dev mode

# Building
pnpm build          # Build all packages
pnpm build:deps     # Build only core dependencies (models, config, database)

# Code Quality
pnpm lint           # Lint all packages
pnpm fmt            # Format code with Prettier
```

### Database Management

```bash
# Start databases
docker compose up -d

# Stop databases
docker compose down

# View logs
docker compose logs -f

# Reset databases (WARNING: deletes all data)
docker compose down -v
```

## API Endpoints

The REST API provides the following endpoints (all authenticated endpoints require `Authorization: Bearer <token>` header):

### Authentication

- `POST /auth/register` - Register a new user
  - Body: `{ username, email, password }`
  - Returns: `{ token, user }`
- `POST /auth/login` - Login and get a JWT token
  - Body: `{ email, password }`
  - Returns: `{ token, user }`

### Users

- `GET /users/@me` - Get current authenticated user
- `GET /users/:userId` - Get user by ID
- `PATCH /users/@me` - Update current user profile
  - Body: `{ username?, displayName?, bio?, avatar? }`

### Channels

- `GET /channels/:channelId` - Get channel information
- `POST /channels/create-dm` - Create a direct message channel
  - Body: `{ recipientId }`
- `GET /channels/:channelId/messages` - Get messages from a channel
  - Query: `?limit=50&before=messageId`
- `POST /channels/:channelId/messages` - Send a message to a channel
  - Body: `{ content, attachments? }`
- `DELETE /channels/:channelId/messages/:messageId` - Delete a message

### Servers

- `POST /servers/create` - Create a new server
  - Body: `{ name, description? }`
- `GET /servers/:serverId` - Get server information
- `PATCH /servers/:serverId` - Update server settings
- `DELETE /servers/:serverId` - Delete a server
- `POST /servers/:serverId/join` - Join a server (via invite)
- `GET /servers/:serverId/members` - Get server members

### File Uploads

- `POST /upload/avatar` - Upload user avatar
- `POST /upload/server-icon` - Upload server icon  
- `POST /upload/attachment` - Upload message attachment

## WebSocket Events

The WebSocket server handles real-time bidirectional communication. Connect to `ws://localhost:3001` (development) or `ws://localhost:8080/ws` (Docker).

### Client → Server Events

- `Authenticate` - Authenticate the WebSocket connection
  - Payload: `{ type: 'Authenticate', token: 'jwt_token' }`
- `Ping` - Keep-alive ping
- `BeginTyping` / `Typing` - User started typing in a channel
  - Payload: `{ type: 'BeginTyping', channel: 'channelId' }`
- `EndTyping` / `StopTyping` - User stopped typing in a channel
  - Payload: `{ type: 'EndTyping', channel: 'channelId' }`

### Server → Client Events

**Connection Events:**
- `Authenticated` - Authentication successful
- `Ready` - Initial data sync (users, servers, channels, members)
- `Pong` - Response to ping
- `Error` - Error message

**Message Events:**
- `Message` - New message received
- `MessageUpdate` - Message edited
- `MessageDelete` - Message deleted
- `MessageReact` - Reaction added to message
- `MessageUnreact` - Reaction removed from message

**Channel Events:**
- `ChannelCreate` - New channel created
- `ChannelUpdate` - Channel updated
- `ChannelDelete` - Channel deleted
- `ChannelStartTyping` / `Typing` - User started typing
- `ChannelStopTyping` / `StopTyping` - User stopped typing

**Server Events:**
- `ServerUpdate` - Server settings updated
- `ServerDelete` - Server deleted
- `ServerMemberJoin` - User joined server
- `ServerMemberLeave` - User left server
- `ServerMemberUpdate` - Member settings updated

**User Events:**
- `UserUpdate` - User profile updated
- `UserPresence` - User online/offline status changed
- `UserRelationship` - Friend relationship changed

## Configuration

### Environment Variables

Create a `.env` file in the root directory (copy from `.env.example`):

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/barachat  # For local dev
# MONGODB_URI=mongodb://mongodb:27017/barachat  # For Docker (auto-set)
REDIS_URL=redis://localhost:6379                # For local dev
# REDIS_URL=redis://redis:6379                  # For Docker (auto-set)

# Server Configuration
API_PORT=3000                # Port for REST API
WS_PORT=3001                 # Port for WebSocket server
HOST=0.0.0.0                 # Listen on all interfaces

# Security (CRITICAL: Change in production!)
JWT_SECRET=change-me-in-production-to-a-secure-random-string

# Frontend
APP_URL=http://localhost:5173  # For CORS configuration
```

### Frontend Environment Variables

Create `packages/web/.env` (copy from `packages/web/.env.example`):

```env
# For local development
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3001

# For Docker deployment, these are set during build:
# VITE_API_URL=/api
# VITE_WS_URL=/ws
```

### Production Security

⚠️ **Important for production deployments:**

1. **Generate a strong JWT secret:**
   ```bash
   openssl rand -hex 32
   ```
   Set this as `JWT_SECRET` in your `.env` file.

2. **Use HTTPS:** Deploy behind a reverse proxy with SSL/TLS (Cloudflare, nginx with Let's Encrypt, etc.)

3. **Secure MongoDB and Redis:** Use authentication and restrict network access

4. **Regular backups:** Set up automated backups for MongoDB data

## Production Deployment

### Using Docker Compose (Recommended)

The easiest way to deploy Barachat in production is using Docker Compose. See [DOCKER.md](DOCKER.md) for detailed instructions.

```bash
# Set a secure JWT secret
echo "JWT_SECRET=$(openssl rand -hex 32)" > .env

# Build and start all services
docker compose up -d

# View logs
docker compose logs -f
```

The application will be available at `http://localhost:8080` (or your configured port).

### Manual Production Deployment

If you prefer to run without Docker:

#### 1. Build all packages

```bash
pnpm install --frozen-lockfile
pnpm build
```

#### 2. Set up environment variables

Create a `.env` file with production values (especially a secure `JWT_SECRET`).

#### 3. Start services

You'll need to run these services (consider using PM2, systemd, or similar):

```bash
# Start API server
NODE_ENV=production node packages/api/dist/index.js

# Start WebSocket server  
NODE_ENV=production node packages/websocket/dist/index.js

# Serve web frontend
# Use nginx, Apache, or any static file server to serve packages/web/dist
```

#### 4. Set up reverse proxy

Configure nginx or another reverse proxy to:
- Serve the web frontend at `/`
- Proxy API requests to the API server at `/api`
- Proxy WebSocket connections to the WebSocket server at `/ws`
- Serve uploaded files from the uploads directory

Example nginx configuration is available in `nginx-proxy.conf`.

## Code Organization

### Frontend Architecture

The web frontend follows a component-based architecture with modular CSS:

- **Components**: Organized by feature (modals, pickers, UI components)
- **Styles**: Split into 15 separate CSS files by component/purpose
  - Each component has its own stylesheet for easy maintenance
  - Base styles, buttons, and utility classes in separate files
  - No duplicate CSS classes or redundant code
- **Type Safety**: Full TypeScript coverage with shared types from `@barachat/models`
- **State Management**: Uses Solid.js signals for reactive state

### Backend Architecture

- **Separation of Concerns**: API, WebSocket, Database, and Config are separate packages
- **Shared Models**: Common types and interfaces in `@barachat/models`
- **Middleware**: Authentication and authorization handled via JWT tokens
- **Real-time**: WebSocket server for instant message delivery and presence updates

## Comparison with Stoat/Revolt

This project is inspired by [stoatchat/stoatchat](https://github.com/stoatchat/stoatchat) and [stoatchat/for-web](https://github.com/stoatchat/for-web), but implemented in TypeScript instead of Rust:

| Feature | Stoat (Rust) | Barachat (TypeScript) |
|---------|--------------|----------------------|
| Backend Language | Rust | TypeScript/Node.js |
| API Server | `delta` crate | Express.js |
| WebSocket Server | `bonfire` crate | ws library |
| Frontend | Solid.js | Solid.js |
| Database | MongoDB + Redis | MongoDB + Redis |
| Architecture | Cargo workspace | pnpm workspace |

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Guidelines

- Follow the existing code style and structure
- Write meaningful commit messages
- Test your changes before submitting
- Update documentation when adding new features
- Keep CSS modular - add styles to the appropriate file in `packages/web/src/styles/`

## License

This project is licensed under the AGPL-3.0 License - see the LICENSE file for details.

## Acknowledgments

- Inspired by [Revolt](https://revolt.chat) and [Stoat](https://github.com/stoatchat)
- Built with [Express](https://expressjs.com/), [Solid.js](https://www.solidjs.com/), and [MongoDB](https://www.mongodb.com/)

## Support

For issues and questions, please use the [GitHub Issues](https://github.com/Mar0xy/barachat/issues) page.
