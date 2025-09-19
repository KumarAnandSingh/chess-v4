#!/bin/bash

# Chess v4 Backend Startup Script
# This script starts the Chess v4 backend server

echo "🚀 Starting Chess v4 Backend Server..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ to continue."
    exit 1
fi

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the backend directory."
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies."
        exit 1
    fi
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created. Please review and update configuration if needed."
fi

# Get the port from .env or use default
PORT=$(grep "^PORT=" .env 2>/dev/null | cut -d'=' -f2 || echo "3001")

# Check if port is available
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  Port $PORT is already in use. The server might already be running."
    echo "   Check http://localhost:$PORT/api/health to verify."
    echo ""
    echo "   To stop the existing server:"
    echo "   pkill -f 'node.*server.js'"
    echo ""
    read -p "   Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "🎯 Starting server on port $PORT..."
echo "📋 Available endpoints:"
echo "   📊 Health: http://localhost:$PORT/api/health"
echo "   🏠 Status: http://localhost:$PORT/"
echo "   🚪 Rooms: http://localhost:$PORT/api/rooms"
echo "   🔌 Socket: http://localhost:$PORT/socket.io"
echo ""
echo "🛑 Press Ctrl+C to stop the server"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Start the server
exec node server.js