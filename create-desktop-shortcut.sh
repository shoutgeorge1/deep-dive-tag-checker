#!/bin/bash

# Create desktop shortcut for the tag audit tool

SCRIPT_PATH="$HOME/Desktop/Start Tag Audit.command"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cat > "$SCRIPT_PATH" << 'EOF'
#!/bin/bash

# Change to the project directory
cd ~/OC_Dental_tag_issues

# Check if we're in the right directory
if [ ! -f "audit.js" ]; then
    echo "❌ Error: Can't find audit.js"
    echo "Please make sure the project is in ~/OC_Dental_tag_issues"
    echo ""
    read -p "Press Enter to exit..."
    exit 1
fi

# Clear screen
clear

echo "🚀 Starting Google Tag Audit Tool..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies (first time only)..."
    npm install
    echo ""
fi

# Check if Playwright browser is installed
if ! ls ~/Library/Caches/ms-playwright/chromium-* 1> /dev/null 2>&1; then
    echo "🌐 Installing Playwright browser (first time only)..."
    npx playwright install chromium
    echo ""
fi

echo "✅ Starting server..."
echo ""
echo "📍 Your tool is available at: http://localhost:3000"
echo ""
echo "💡 To share with others:"
echo "   1. Open a new Terminal window"
echo "   2. Run: ngrok http 3000"
echo "   3. Share the ngrok link"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Start the server
node server.js

# Keep window open if there's an error
if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Server stopped. Check the error above."
    echo ""
    read -p "Press Enter to close..."
fi
EOF

chmod +x "$SCRIPT_PATH"

echo "✅ Desktop shortcut created!"
echo ""
echo "📱 Look for 'Start Tag Audit.command' on your Desktop"
echo "   Just double-click it to launch the tool!"
echo ""

