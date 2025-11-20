#!/bin/bash
# Bash script to start frontend development server
# Usage: ./scripts/dev-frontend.sh

echo "🚀 Starting Frontend Development Server..."

# Check if .env.local exists
if [ ! -f "frontend/.env.local" ]; then
    echo "⚠️  .env.local not found. Creating from example..."
    cp frontend/.env.local.example frontend/.env.local
    echo "✅ Created .env.local. Please check the values!"
fi

# Check if node_modules exists
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing dependencies..."
    cd frontend
    npm install --legacy-peer-deps
    cd ..
fi

# Start dev server
echo ""
echo "✨ Starting Next.js development server..."
echo "   Frontend: http://localhost:3000"
echo "   API: http://localhost:8080/api"
echo ""
echo "   Press Ctrl+C to stop"
echo ""

cd frontend
npm run dev

