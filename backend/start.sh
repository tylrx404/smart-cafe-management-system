#!/bin/bash

# CafeOS Backend - Quick Setup Script
# This script sets up and runs the backend server

echo "🚀 CafeOS Backend Setup"
echo "======================="

# Navigate to backend directory
cd backend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
else
    echo "✓ Dependencies already installed"
fi

# Start the server
echo ""
echo "🔥 Starting CafeOS Backend Server..."
echo ""
npm start
