#!/bin/bash

# Create a proper macOS app with icon

APP_NAME="Tag Audit"
APP_DIR="$HOME/Desktop/${APP_NAME}.app"
CONTENTS_DIR="${APP_DIR}/Contents"
MACOS_DIR="${CONTENTS_DIR}/MacOS"
RESOURCES_DIR="${CONTENTS_DIR}/Resources"

# Remove old app if exists
rm -rf "$APP_DIR"

# Create app structure
mkdir -p "$MACOS_DIR"
mkdir -p "$RESOURCES_DIR"

# Create Info.plist
cat > "${CONTENTS_DIR}/Info.plist" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>TagAudit</string>
    <key>CFBundleIdentifier</key>
    <string>com.tagaudit.app</string>
    <key>CFBundleName</key>
    <string>Tag Audit</string>
    <key>CFBundleVersion</key>
    <string>1.0</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
    <key>CFBundleIconFile</key>
    <string>appicon</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.13</string>
</dict>
</plist>
EOF

# Create the executable script
cat > "${MACOS_DIR}/TagAudit" << 'SCRIPT'
#!/bin/bash

cd ~/OC_Dental_tag_issues

if [ ! -f "audit.js" ]; then
    osascript -e 'display dialog "Error: Can'\''t find the project. Make sure it'\''s in ~/OC_Dental_tag_issues" buttons {"OK"} default button "OK"'
    exit 1
fi

# Open Terminal and run
osascript << 'APPLESCRIPT'
tell application "Terminal"
    activate
    do script "cd ~/OC_Dental_tag_issues && clear && echo '🚀 Starting Google Tag Audit Tool...' && echo '' && if [ ! -d 'node_modules' ]; then echo '📦 Installing dependencies...' && npm install && echo ''; fi && if ! ls ~/Library/Caches/ms-playwright/chromium-* 1> /dev/null 2>&1; then echo '🌐 Installing Playwright browser...' && npx playwright install chromium && echo ''; fi && echo '✅ Starting server at http://localhost:3000' && echo 'Press Ctrl+C to stop' && echo '' && node server.js"
end tell
APPLESCRIPT
SCRIPT

chmod +x "${MACOS_DIR}/TagAudit"

# Create a simple icon using system icon (or create one)
# Try to use a system icon as base
ICON_PATH="${RESOURCES_DIR}/appicon.icns"

# Create icon from emoji/symbol using sips (built into macOS)
# Create a temporary PNG first
TEMP_ICON="/tmp/tag-audit-icon.png"

# Create a simple icon image (512x512) with a tag/audit symbol
# Using Python to create a simple icon if available, otherwise use system icon
if command -v python3 &> /dev/null; then
python3 << 'PYTHON'
from PIL import Image, ImageDraw, ImageFont
import os

# Create 512x512 image
img = Image.new('RGB', (512, 512), color='#667eea')
draw = ImageDraw.Draw(img)

# Draw a simple tag/checkmark symbol
# Draw a circle
draw.ellipse([100, 100, 412, 412], fill='white', outline='white', width=10)

# Draw checkmark
draw.line([(180, 256), (230, 306), (332, 180)], fill='#667eea', width=40)
draw.line([(230, 306), (332, 180)], fill='#667eea', width=40)

# Save
img.save('/tmp/tag-audit-icon.png')
PYTHON
    if [ -f "/tmp/tag-audit-icon.png" ]; then
        # Convert to icns
        sips -s format icns /tmp/tag-audit-icon.png --out "$ICON_PATH" 2>/dev/null || {
            # If sips fails, try iconutil
            mkdir -p /tmp/tag-audit-icon.iconset
            sips -z 16 16 /tmp/tag-audit-icon.png --out /tmp/tag-audit-icon.iconset/icon_16x16.png 2>/dev/null
            sips -z 32 32 /tmp/tag-audit-icon.png --out /tmp/tag-audit-icon.iconset/icon_16x16@2x.png 2>/dev/null
            sips -z 32 32 /tmp/tag-audit-icon.png --out /tmp/tag-audit-icon.iconset/icon_32x32.png 2>/dev/null
            sips -z 64 64 /tmp/tag-audit-icon.png --out /tmp/tag-audit-icon.iconset/icon_32x32@2x.png 2>/dev/null
            sips -z 128 128 /tmp/tag-audit-icon.png --out /tmp/tag-audit-icon.iconset/icon_128x128.png 2>/dev/null
            sips -z 256 256 /tmp/tag-audit-icon.png --out /tmp/tag-audit-icon.iconset/icon_128x128@2x.png 2>/dev/null
            sips -z 256 256 /tmp/tag-audit-icon.png --out /tmp/tag-audit-icon.iconset/icon_256x256.png 2>/dev/null
            sips -z 512 512 /tmp/tag-audit-icon.png --out /tmp/tag-audit-icon.iconset/icon_256x256@2x.png 2>/dev/null
            sips -z 512 512 /tmp/tag-audit-icon.png --out /tmp/tag-audit-icon.iconset/icon_512x512.png 2>/dev/null
            iconutil -c icns /tmp/tag-audit-icon.iconset -o "$ICON_PATH" 2>/dev/null
        }
    fi
fi

# If icon creation failed, use a system icon as fallback
if [ ! -f "$ICON_PATH" ]; then
    # Copy a system icon (Terminal icon) as fallback
    cp /System/Library/CoreServices/Terminal.app/Contents/Resources/Terminal.icns "$ICON_PATH" 2>/dev/null || {
        # Last resort: create empty icon file
        touch "$ICON_PATH"
    }
fi

# Set the icon on the app
if [ -f "$ICON_PATH" ] && [ -s "$ICON_PATH" ]; then
    # Use fileicon if available, or Rez/DeRez
    if command -v fileicon &> /dev/null; then
        fileicon set "$APP_DIR" "$ICON_PATH" 2>/dev/null
    else
        # Try using osascript to set icon
        osascript << APPLESCRIPT
        tell application "Finder"
            set theFile to POSIX file "$APP_DIR"
            set theIcon to POSIX file "$ICON_PATH"
            set icon of theFile to theIcon
        end tell
APPLESCRIPT
    fi
fi

echo "✅ Created app: ${APP_NAME}.app on your Desktop!"
echo "   It should have a custom icon now!"
echo ""
echo "   Double-click 'Tag Audit.app' to launch the tool!"

