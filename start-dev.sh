#!/bin/bash

# Kill any existing Next.js development servers
echo "Stopping any existing Next.js servers..."
pkill -f "next dev" 2>/dev/null || true

# Wait a moment for processes to stop
sleep 2

# Clear Next.js cache
echo "Clearing Next.js cache..."
rm -rf .next

# Start the development server
echo "Starting Next.js development server..."
yarn dev 