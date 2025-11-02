# Barachat

<div align="center">

A modern chat platform built with TypeScript

[![License](https://img.shields.io/badge/license-AGPL--3.0-blue)](LICENSE)

</div>

## Overview

Barachat is a TypeScript implementation of a chat platform similar to Stoat/Revolt. It features:

- **REST API Server** - Express-based API for all platform operations
- **WebSocket Server** - Real-time communication using WebSockets
- **Web Frontend** - Modern web client built with Solid.js
- **Database Layer** - MongoDB for persistence and Redis for caching
- **Modular Architecture** - Organized as a monorepo with separate packages

## Architecture

This project is a monorepo containing the following packages:

| Package | Description |
|---------|-------------|
| `@barachat/models` | Core data models and type definitions |
| `@barachat/config` | Configuration management |
| `@barachat/database` | Database layer (MongoDB + Redis) |
| `@barachat/api` | REST API server (Express) |
| `@barachat/websocket` | WebSocket events server |
| `@barachat/web` | Web frontend (Solid.js) |

## Prerequisites

Before getting started, ensure you have:

- **Node.js** >= 18
- **pnpm** >= 8 (run `corepack enable` to install)
- **Docker** and **Docker Compose** (for databases)
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
- Build and start the API server, WebSocket server, and web frontend
- Start MongoDB and Redis (no external ports exposed)
- Set up an internal network for all services
- Expose only port 8080 through an nginx reverse proxy

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

#### Prerequisites
- **Node.js** >= 18
- **pnpm** >= 8 (run `corepack enable` to install)
- **Docker** and **Docker Compose** (for databases)
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
│   ├── models/          # Data models and types
│   ├── config/          # Configuration
│   ├── database/        # Database layer
│   ├── api/            # REST API server
│   ├── websocket/      # WebSocket server
│   └── web/            # Web frontend
├── docker-compose.yml  # Database services
├── package.json        # Root package.json
└── pnpm-workspace.yaml # pnpm workspace config
```

### Available Scripts

```bash
# Development
pnpm dev:api        # Run API server in dev mode
pnpm dev:ws         # Run WebSocket server in dev mode
pnpm dev:web        # Run web frontend in dev mode

# Building
pnpm build          # Build all packages
pnpm build:deps     # Build only core dependencies

# Code Quality
pnpm lint           # Lint all packages
pnpm fmt            # Format code with Prettier

# Testing
pnpm test           # Run tests in all packages
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

### Authentication

- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login and get a token

### Users

- `GET /users/@me` - Get current user
- `GET /users/:userId` - Get user by ID
- `PATCH /users/@me` - Update current user

### Channels

- `GET /channels/:channelId` - Get channel info
- `POST /channels/create-dm` - Create a direct message
- `GET /channels/:channelId/messages` - Get messages
- `POST /channels/:channelId/messages` - Send a message

### Servers

- `POST /servers/create` - Create a new server
- `GET /servers/:serverId` - Get server info

## WebSocket Events

The WebSocket server supports real-time events:

- **Connection**: `Authenticate`, `Ready`, `Pong`
- **Messages**: `Message`, `MessageUpdate`, `MessageDelete`
- **Channels**: `ChannelCreate`, `ChannelUpdate`, `ChannelDelete`
- **Typing**: `BeginTyping`, `EndTyping`
- **Presence**: `UserPresence`
- **Servers**: `ServerUpdate`, `ServerDelete`, `ServerMemberJoin`, etc.

## Configuration

Environment variables can be configured in `.env`:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/barachat
REDIS_URL=redis://localhost:6379

# Server
API_PORT=3000
WS_PORT=3001
HOST=0.0.0.0

# Security
JWT_SECRET=your-secret-key-here

# Frontend
APP_URL=http://localhost:5173
```

## Production Deployment

### Build for production

```bash
# Build all packages
pnpm build
```

### Run in production

```bash
# Start API server
node packages/api/dist/index.js

# Start WebSocket server
node packages/websocket/dist/index.js

# Serve web frontend (using a static file server)
# The built files are in packages/web/dist
```

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

## License

This project is licensed under the AGPL-3.0 License - see the LICENSE file for details.

## Acknowledgments

- Inspired by [Revolt](https://revolt.chat) and [Stoat](https://github.com/stoatchat)
- Built with [Express](https://expressjs.com/), [Solid.js](https://www.solidjs.com/), and [MongoDB](https://www.mongodb.com/)

## Support

For issues and questions, please use the [GitHub Issues](https://github.com/Mar0xy/barachat/issues) page.
