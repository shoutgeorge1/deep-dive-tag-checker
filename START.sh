#!/bin/bash

echo "🚀 Starting Google Tag Audit Tool..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if Playwright browser is installed
if [ ! -d "$HOME/Library/Caches/ms-playwright/chromium-*" ] 2>/dev/null; then
    echo "🌐 Installing Playwright browser..."
    npx playwright install chromium
fi

echo ""
echo "✅ Starting server..."
echo "📍 Your tool will be available at: http://localhost:3000"
echo ""
echo "💡 To share with others, open a new terminal and run:"
echo "   ngrok http 3000"
echo ""

node server.js

