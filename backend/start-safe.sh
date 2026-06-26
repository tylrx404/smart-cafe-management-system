#!/bin/bash

# CafeOS Backend - Start Script with Port Conflict Resolution

PORT=${1:-5173}

echo "🚀 CafeOS Backend Startup"
echo "========================="
echo ""

# Check if port is in use
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port $PORT is already in use."
    echo ""
    echo "Options:"
    echo "1. Kill the process and restart:"
    echo "   ./start.sh --kill"
    echo ""
    echo "2. Use a different port:"
    echo "   PORT=3000 npm start"
    echo ""
    echo "3. Manually kill the process:"
    echo "   lsof -ti :$PORT | xargs kill -9"
    exit 1
fi

# Check for --kill flag
if [ "$1" == "--kill" ]; then
    echo "Killing processes on port $PORT..."
    lsof -ti :$PORT | xargs kill -9 2>/dev/null
    echo "✓ Killed"
    echo ""
    PORT=5173
fi

echo "Starting backend server on port $PORT..."
echo ""
PORT=$PORT npm start
