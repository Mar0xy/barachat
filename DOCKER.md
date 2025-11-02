# Docker Deployment Guide

This document provides additional information about deploying Barachat using Docker.

## Architecture

The Docker Compose setup uses the following architecture:

```
                    ┌─────────────────┐
                    │   Port 8080     │
                    │  (Public Port)  │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Nginx Proxy    │
                    │   (Routing)     │
                    └─┬──────┬──────┬─┘
                      │      │      │
         ┌────────────┴┐  ┌──▼───┐ └─────────┐
         │             │  │      │           │
    ┌────▼────┐  ┌────▼───▼──┐  ┌▼──────────▼┐
    │   Web   │  │    API    │  │  WebSocket │
    │Frontend │  │  Server   │  │   Server   │
    └─────────┘  └─────┬─────┘  └──────┬─────┘
                       │                │
                  ┌────▼────────────────▼───┐
                  │                          │
              ┌───▼────┐              ┌─────▼──┐
              │MongoDB │              │ Redis  │
              │  (DB)  │              │(Cache) │
              └────────┘              └────────┘

All connections happen on the barachat-network (private)
```

## Network Configuration

- **Network Name**: `barachat-network`
- **Network Type**: Bridge
- **External Access**: Only port 8080 (nginx)
- **Internal Services**: All services communicate via service names (e.g., `mongodb:27017`)

## Service Details

### MongoDB
- **Internal Port**: 27017
- **External Port**: None (not exposed)
- **Connection String**: `mongodb://mongodb:27017/barachat`
- **Data Volume**: `mongodb_data`

### Redis
- **Internal Port**: 6379
- **External Port**: None (not exposed)
- **Connection String**: `redis://redis:6379`
- **Data Volume**: `redis_data`

### API Server
- **Internal Port**: 3000
- **External Access**: Via `/api` route on port 8080
- **Built from**: `Dockerfile.api`

### WebSocket Server
- **Internal Port**: 3001
- **External Access**: Via `/ws` route on port 8080
- **Built from**: `Dockerfile.websocket`

### Web Frontend
- **Internal Port**: 80
- **External Access**: Via `/` route on port 8080
- **Built from**: `Dockerfile.web`

### Nginx Reverse Proxy
- **External Port**: 8080
- **Configuration**: `nginx-proxy.conf`
- **Routes**:
  - `/` → Web frontend (SPA)
  - `/api/*` → API server
  - `/ws` → WebSocket server

## Environment Variables

Set these in a `.env` file at the root of the project:

```env
JWT_SECRET=your-secure-random-string-here
```

Other environment variables are set automatically in `docker-compose.yml`.

## Building and Running

### First Time Setup
```bash
# Clone the repository
git clone https://github.com/Mar0xy/barachat.git
cd barachat

# (Optional) Create .env file
echo "JWT_SECRET=$(openssl rand -hex 32)" > .env

# Build and start all services
docker compose up -d
```

### Viewing Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f api
docker compose logs -f websocket
docker compose logs -f web
docker compose logs -f nginx
```

### Rebuilding After Code Changes
```bash
# Rebuild all services
docker compose build

# Rebuild specific service
docker compose build api

# Rebuild and restart
docker compose up -d --build
```

### Stopping Services
```bash
# Stop without removing containers
docker compose stop

# Stop and remove containers
docker compose down

# Stop and remove containers + volumes (deletes data)
docker compose down -v
```

## Production Considerations

### Security
1. **Change JWT_SECRET**: Generate a strong random secret
   ```bash
   openssl rand -hex 32
   ```

2. **Use HTTPS**: Put Cloudflare, AWS ALB, or similar in front of the nginx service

3. **Database Backups**: Set up regular backups of the MongoDB volume
   ```bash
   docker run --rm -v barachat_mongodb_data:/data -v $(pwd):/backup \
     alpine tar czf /backup/mongodb-backup.tar.gz /data
   ```

### Scaling
To scale API or WebSocket servers:
```bash
docker compose up -d --scale api=3 --scale websocket=2
```

Note: You'll need to update nginx configuration to load balance.

### Resource Limits
Add resource limits in `docker-compose.yml`:
```yaml
services:
  api:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

## Troubleshooting

### Port Already in Use
If port 8080 is already in use, change it in `docker-compose.yml`:
```yaml
nginx:
  ports:
    - "3000:80"  # Use port 3000 instead
```

### Services Can't Connect to Database
Check that all services are on the same network:
```bash
docker network inspect barachat_barachat-network
```

### View Service Health
```bash
docker compose ps
```

### Access MongoDB Directly (for debugging)
```bash
# Start a MongoDB shell
docker compose exec mongodb mongosh barachat
```

### Access Redis Directly (for debugging)
```bash
# Start a Redis CLI
docker compose exec redis redis-cli
```
