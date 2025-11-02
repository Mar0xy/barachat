# GitHub Actions Workflows

## docker-build-push.yml

This workflow automatically builds and publishes Docker images to GitHub Container Registry (GHCR) for the Barachat application.

### Trigger Events

The workflow runs on:
- **Push to main/master branch**: Builds and pushes images with `latest` tag and branch-specific tags
- **Pull requests**: Builds images but doesn't push them (validation only)
- **Manual trigger**: Can be manually triggered via GitHub Actions UI using `workflow_dispatch`

### Images Built

The workflow builds and publishes three Docker images:

1. **API Server** (`ghcr.io/mar0xy/barachat-api`)
   - Built from `Dockerfile.api`
   - Contains the Express-based REST API server

2. **WebSocket Server** (`ghcr.io/mar0xy/barachat-websocket`)
   - Built from `Dockerfile.websocket`
   - Contains the WebSocket server for real-time communication

3. **Web Frontend** (`ghcr.io/mar0xy/barachat-web`)
   - Built from `Dockerfile.web`
   - Contains the Solid.js web application served by nginx

### Image Tags

Images are tagged with multiple tags for flexibility:

- `latest` - Latest version from the default branch (main/master)
- `<branch-name>` - Branch name for feature branches
- `pr-<number>` - Pull request number for PR builds (not pushed)
- `<branch>-<sha>` - Branch name with short commit SHA
- Semantic version tags when using git tags (e.g., `v1.0.0`, `1.0`, `1`)

### Features

- **Layer caching**: Uses GitHub Actions cache to speed up builds
- **Parallel builds**: All three images are built simultaneously for faster execution
- **Build provenance**: Includes image metadata and labels
- **Security**: Images are only pushed on non-PR events
- **Permissions**: Uses minimal required permissions (read contents, write packages)

### Usage

Images are automatically published to GHCR and can be used by:

```bash
# Pull latest images
docker pull ghcr.io/mar0xy/barachat-api:latest
docker pull ghcr.io/mar0xy/barachat-websocket:latest
docker pull ghcr.io/mar0xy/barachat-web:latest

# Or use docker-compose (configured by default)
docker compose pull
docker compose up -d
```

### Manual Trigger

To manually trigger the workflow:

1. Go to the Actions tab in GitHub
2. Select "Build and Push Docker Images" workflow
3. Click "Run workflow"
4. Select the branch and click "Run workflow"

### Permissions

The workflow requires the following permissions:
- `contents: read` - To checkout the repository
- `packages: write` - To push images to GHCR

These are configured at the job level for security.
