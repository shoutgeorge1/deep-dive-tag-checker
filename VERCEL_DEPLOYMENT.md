# Deploying to Vercel

## ⚠️ Important Limitation

**Vercel serverless functions don't support Playwright** (the browser automation tool we use). 

However, you can still deploy the web interface to Vercel! Here are your options:

## Option 1: Vercel Frontend + Railway/Render Backend (Recommended)

Deploy the web interface to Vercel, and run the audit API on Railway or Render.

### Step 1: Deploy Backend to Railway/Render

1. **Railway:**
   - Go to [railway.app](https://railway.app)
   - Deploy from GitHub: `deep-dive-tag-checker`
   - Railway will auto-detect and deploy
   - Copy your Railway URL (e.g., `https://your-project.railway.app`)

2. **Render:**
   - Go to [render.com](https://render.com)
   - New → Web Service
   - Connect `deep-dive-tag-checker`
   - Build: `npm install && npx playwright install chromium`
   - Start: `node server.js`
   - Copy your Render URL

### Step 2: Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "Add New Project"
4. Import `deep-dive-tag-checker`
5. **Add Environment Variable:**
   - Key: `AUDIT_BACKEND_URL`
   - Value: Your Railway/Render URL (e.g., `https://your-project.railway.app`)
6. Deploy!

The web interface will be on Vercel, and it will proxy audit requests to your Railway/Render backend.

## Option 2: Deploy Everything to Railway/Render (Simpler)

Skip Vercel entirely and deploy everything to Railway or Render:

1. Deploy `server.js` to Railway/Render
2. The web interface is served by the same server
3. One URL for everything
4. Full Playwright support

**This is simpler and recommended if you don't need Vercel's CDN benefits.**

## Option 3: Vercel Static Only (No Audits)

Deploy just the static web interface to Vercel:

1. Deploy to Vercel (it will serve the static files)
2. The interface will be live, but audits won't work
3. Good for: Documentation, sharing the tool design

## Quick Deploy Commands

### Deploy to Vercel:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variable
vercel env add AUDIT_BACKEND_URL
# Enter your Railway/Render URL when prompted
```

### Or use Vercel Dashboard:

1. Go to vercel.com
2. Import GitHub repo
3. Add env var in Settings → Environment Variables
4. Deploy

## Recommended Setup

**For production use, I recommend Option 2 (Railway/Render only):**
- Simpler setup
- Full functionality
- One deployment
- No proxy complexity

**Use Vercel + Backend if:**
- You want Vercel's CDN for the static files
- You need edge caching
- You're already using Vercel for other projects

## Troubleshooting

**"Backend service not configured" error:**
- Make sure `AUDIT_BACKEND_URL` is set in Vercel environment variables
- Make sure your Railway/Render service is running
- Check that the URL is correct (include `https://`)

**Audits not working:**
- Check Railway/Render logs
- Verify Playwright is installed on backend
- Test backend directly: `curl -X POST https://your-backend.railway.app/api/audit`

