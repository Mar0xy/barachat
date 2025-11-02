#!/bin/bash

# Start Barachat Development Environment
# This script starts all development servers together

set -e

# Cleanup function to stop all background processes
cleanup() {
    echo ""
    echo "Stopping all services..."
    
    # Kill background jobs started by this script
    jobs -p | xargs -r kill 2>/dev/null || true
    
    echo "All services stopped."
    exit 0
}

# Set up trap to call cleanup on script exit
trap cleanup EXIT INT TERM

echo "Starting Barachat..."
echo ""

# Check if Docker Compose is running
if ! docker compose ps | grep -q "mongodb"; then
    echo "Starting databases..."
    docker compose up -d
    echo "Waiting for databases to be ready..."
    sleep 3
fi

echo "Starting API server..."
pnpm --filter @barachat/api dev &
API_PID=$!

echo "Starting WebSocket server..."
pnpm --filter @barachat/websocket dev &
WS_PID=$!

echo "Starting web frontend..."
pnpm --filter @barachat/web dev &
WEB_PID=$!

echo ""
echo "Barachat is running!"
echo "- Web Frontend: http://localhost:5173"
echo "- API Server: http://localhost:3000"
echo "- WebSocket Server: ws://localhost:3001"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for background jobs
wait
