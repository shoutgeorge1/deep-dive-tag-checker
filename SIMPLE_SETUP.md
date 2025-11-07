# Simple Setup - Just Use It! 🚀

## The Easiest Way (Local - No Deployment Hassle)

### 1. Run Locally (Takes 2 minutes)

```bash
# Install dependencies
npm install

# Install Playwright browser
npx playwright install chromium

# Start the web interface
npm run server

# Visit http://localhost:3000
```

**That's it!** The tool runs on your computer. You can:
- Use it yourself
- Share your screen with others
- Or use ngrok (see below) to share a link

---

## Share with Others (Super Simple)

### Option 1: Use ngrok (Free, 2 minutes)

```bash
# Install ngrok (one time)
brew install ngrok
# or download from ngrok.com

# Start your server
npm run server

# In another terminal, create a public link
ngrok http 3000
```

**You get a link like:** `https://abc123.ngrok.io`

Share that link - anyone can use your tool! (Free tier: link changes each time, but works great)

---

### Option 2: Docker (One Command)

```bash
# Build and run
docker-compose up

# Visit http://localhost:3000
```

Everything is packaged - no setup needed!

---

### Option 3: Just Share Results

Run audits locally, then share the results:

```bash
# Run audit
npm start

# Results are in ./out/
# Share the findings.md file with people
```

---

## Quick Fix for Playwright Error

If you see "browser type launch executor doesn't exist":

```bash
# Reinstall Playwright browsers
npx playwright install chromium --force

# Or reinstall everything
rm -rf node_modules
npm install
npx playwright install chromium
```

---

## Simplest Workflow

1. **When you need it:**
   ```bash
   npm run server
   ```

2. **To share with others:**
   ```bash
   ngrok http 3000
   # Share the ngrok link
   ```

3. **Done!** No deployment, no complexity, just works.

---

## Why This is Better

- ✅ No deployment complexity
- ✅ No hosting costs
- ✅ Works immediately
- ✅ Full control
- ✅ Easy to share (ngrok)
- ✅ No credit cards needed

**Just run it when you need it, share the ngrok link, done!** 🎉

