# Web Interface Deployment Guide

## 🎯 Overview

The tool now includes a web interface! Users can visit a URL, enter their domain, and run audits through a browser.

## 🚀 Quick Deploy Options

### Option 1: Railway.app (Recommended) ⭐

**Best for:** Full functionality with Playwright support

1. Go to [railway.app](https://railway.app)
2. Sign up/login with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Railway will auto-detect Node.js
6. Add environment variable (optional):
   - `PORT=3000` (usually auto-set)
7. Deploy!

**Your tool will be live at:** `https://your-project.railway.app`

### Option 2: Render.com

**Best for:** Free tier with Playwright support

1. Go to [render.com](https://render.com)
2. Sign up/login
3. Click "New" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   - **Name:** google-tag-audit
   - **Environment:** Node
   - **Build Command:** `npm install && npx playwright install chromium`
   - **Start Command:** `node server.js`
6. Deploy!

**Your tool will be live at:** `https://your-project.onrender.com`

### Option 3: Fly.io

1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Run: `fly launch`
3. Follow prompts
4. Deploy: `fly deploy`

## 📋 Pre-Deployment Setup

### 1. Install Dependencies

The web interface requires Express:

```bash
npm install
```

### 2. Test Locally

```bash
# Start the server
node server.js

# Visit http://localhost:3000
```

### 3. Environment Variables

No environment variables required! The server uses:
- `PORT` (auto-set by hosting platform)
- Defaults to port 3000 if not set

## 🎨 Features

The web interface includes:

- ✅ **Domain Input**: Enter any website domain
- ✅ **URL List**: Optionally provide specific URLs
- ✅ **Progress Tracking**: Real-time progress updates
- ✅ **Results Download**: Download findings, CSV, and JSON data
- ✅ **Mobile Responsive**: Works on all devices

## 🔧 How It Works

1. User visits your deployed URL
2. Enters domain or URL list
3. Clicks "Start Audit"
4. Server runs the audit tool in the background
5. Progress updates stream to the browser
6. Results are saved and downloadable

## 📝 API Endpoint

The API endpoint is at `/api/audit`:

```javascript
POST /api/audit
Content-Type: application/json

{
  "domain": "https://example.com",
  "urls": ["https://example.com/page1/", "https://example.com/page2/"],
  "maxPages": 100
}
```

Returns Server-Sent Events (SSE) stream with progress updates.

## 🐛 Troubleshooting

### Playwright not working

Make sure your hosting platform supports Playwright:
- ✅ Railway: Works out of the box
- ✅ Render: Works with build command
- ❌ Vercel: Doesn't support Playwright (use Railway/Render instead)

### Port issues

The server auto-detects the port from `process.env.PORT`. Most platforms set this automatically.

### Timeout issues

Large audits may take 10-30 minutes. Make sure your hosting platform allows long-running requests:
- Railway: ✅ Supports long requests
- Render: ⚠️ Free tier has 30s timeout (upgrade for longer)
- Fly.io: ✅ Supports long requests

## 🔒 Security Notes

- The tool only reads public pages (no authentication)
- Results are stored temporarily in `public/results/`
- Consider adding rate limiting for production use
- Add authentication if you want to restrict access

## 📊 Sharing Your Tool

Once deployed, share the URL with:
- Your team
- Clients
- The community (if open source)

Example: "Check out our Google Tag Audit Tool: https://tag-audit.railway.app"

## 🎯 Next Steps

1. Deploy to Railway or Render
2. Test with a small audit
3. Share the URL
4. Monitor usage and results

Enjoy your web-based audit tool! 🎉

