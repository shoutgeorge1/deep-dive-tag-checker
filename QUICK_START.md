# Quick Start Guide

## 🚀 How to Access & Use This Tool

### Option 1: Run Locally (What You're Doing Now) ✅

**This is the simplest way!**

```bash
# You're already set up! Just run:
npm start

# Results appear in ./out/
open out/findings.md
```

**Pros:** Fast, full control, works perfectly  
**Cons:** Only runs on your computer

---

### Option 2: Push to GitHub + Deploy Web Interface

**For sharing the tool with your team:**

1. **Push to GitHub:**
```bash
# Create repo on GitHub first, then:
git remote add origin https://github.com/YOUR_USERNAME/OC_Dental_tag_issues.git
git branch -M main
git push -u origin main
```

2. **Deploy to Vercel (Web Interface Only):**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repo
   - Deploy!

**What you get:**
- ✅ Nice web interface at `your-project.vercel.app`
- ✅ Team can see the tool
- ❌ **BUT:** The actual audit won't run on Vercel (Playwright doesn't work there)

**Use case:** Share the tool, documentation, and view past results

---

### Option 3: GitHub Actions (Scheduled Audits) ⭐ RECOMMENDED

**Run audits automatically on a schedule:**

1. Push to GitHub (same as above)
2. Go to your repo → Settings → Actions → Enable Actions
3. The included workflow (`.github/workflows/audit.yml`) will:
   - Run weekly (or manually)
   - Save results as downloadable artifacts
   - Email you when done (if configured)

**Pros:** Automated, runs in the cloud, results saved  
**Cons:** Need to download results from GitHub

---

### Option 4: Deploy to Railway/Render (Full Functionality)

**For a web interface that actually runs audits:**

1. Push to GitHub
2. Go to [railway.app](https://railway.app) or [render.com](https://render.com)
3. Connect your GitHub repo
4. Deploy!

**Pros:** Full functionality, web interface, runs audits  
**Cons:** Costs money (free tier available)

---

## 🎯 My Recommendation

**For your use case (auditing many landing pages):**

1. **Keep running locally** - It's working great!
2. **Push to GitHub** - For backup and version control
3. **Deploy to Vercel** - For sharing the tool/docs with your team
4. **Set up GitHub Actions** - For automated weekly audits

---

## 📋 Step-by-Step: Push to GitHub

```bash
# 1. Create a new repository on GitHub.com
#    (Don't initialize with README, .gitignore, or license)

# 2. Add the remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/OC_Dental_tag_issues.git

# 3. Push your code
git branch -M main
git push -u origin main

# Done! Your code is now on GitHub
```

---

## 📋 Step-by-Step: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click "Add New Project"
3. Select your `OC_Dental_tag_issues` repository
4. Vercel will auto-detect settings
5. Click "Deploy"
6. Wait ~1 minute
7. Visit your deployed site at `your-project.vercel.app`

**Note:** The web interface will be live, but clicking "Run Audit" won't work (Playwright limitation). The interface is still useful for:
- Viewing documentation
- Sharing the tool with your team
- Linking to past results

---

## 🔄 Daily Workflow

**For regular use:**

```bash
# 1. Update your urls.txt with new landing pages
nano urls.txt

# 2. Run the audit
npm start

# 3. Review results
open out/findings.md
open out/summary.csv

# 4. Share findings.md with your web team
```

That's it! No need to deploy if you're just using it yourself.

