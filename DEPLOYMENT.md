# Deployment Guide

## 🚀 Quick Start

### 1. Push to GitHub

```bash
# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/OC_Dental_tag_issues.git
git branch -M main
git push -u origin main
```

### 2. Deploy Options

#### Option A: Vercel (Web Interface Only)

**Note:** Playwright doesn't work well on Vercel serverless functions. The web interface will be available, but the actual audit must run elsewhere.

1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Vercel will auto-detect the settings
4. Deploy!

The web interface at `/public/index.html` will be live, but the audit API won't work.

#### Option B: Railway.app (Recommended for Full Functionality)

Railway supports Playwright out of the box:

1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway will auto-detect Node.js
5. Add environment variables if needed
6. Deploy!

#### Option C: Render.com

1. Go to [render.com](https://render.com)
2. Create a new "Web Service"
3. Connect your GitHub repository
4. Set:
   - **Build Command:** `npm install && npx playwright install chromium`
   - **Start Command:** `npm start`
5. Deploy!

#### Option D: GitHub Actions (Scheduled Audits)

The included `.github/workflows/audit.yml` will:
- Run audits on a schedule (weekly on Mondays)
- Run manually via GitHub Actions UI
- Save results as artifacts

Just push to GitHub and enable Actions!

## 📋 Environment Variables

No environment variables required for basic usage.

## 🔧 Local Development

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install chromium

# Run audit
npm start

# Results in ./out/
```

## 📊 Accessing Results

- **Local:** Check `./out/` directory
- **GitHub Actions:** Download artifacts from Actions tab
- **Railway/Render:** Results saved to `./out/` (may need to persist volume)

## 🎯 Recommended Setup

For production use, I recommend:

1. **GitHub** - Store code and run scheduled audits via Actions
2. **Railway/Render** - Host the web interface and run on-demand audits
3. **Vercel** - Optional, for just the static web interface

## 🔐 Security Notes

- The audit tool only reads public pages (no authentication needed)
- No sensitive data is stored
- Results can be committed to git (they're just reports)

