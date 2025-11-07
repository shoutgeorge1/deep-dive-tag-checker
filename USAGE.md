# How to Use the Tag Audit Tool

## Quick Start

### Option 1: Auto-Discover Landing Pages (Default)

Just run it - it will automatically find landing pages:

```bash
npm start
```

The tool will:
- Fetch your sitemap.xml
- Crawl your site looking for landing page patterns
- Audit all found pages

### Option 2: Provide Your Own URL List (Recommended for Many Pages)

Create a file called `urls.txt` with all your landing page URLs:

```bash
# Create urls.txt with your URLs
cat > urls.txt << EOF
https://ocdentalspecialists.com/appointment-request/
https://ocdentalspecialists.com/emergency-dentist/
https://ocdentalspecialists.com/contact-us/
https://ocdentalspecialists.com/specials/
https://ocdentalspecialists.com/landing/summer-promo/
https://ocdentalspecialists.com/lp/teeth-whitening/
# Add as many as you need...
EOF

# Run the audit with your custom list
npm start
```

Or specify a different file:

```bash
node audit.js my-landing-pages.txt
```

### Option 3: Export from Google Analytics / Search Console

1. Export your landing page URLs from Google Analytics or Search Console
2. Save them to `urls.txt` (one per line)
3. Run `npm start`

## URL List Format

The `urls.txt` file supports multiple formats:

### Plain URLs (one per line)
```
https://ocdentalspecialists.com/page1/
https://ocdentalspecialists.com/page2/
/contact-us/  # Paths work too (will add domain)
```

### JSON Array (single line)
```
["https://ocdentalspecialists.com/page1/", "https://ocdentalspecialists.com/page2/"]
```

### Comments
Lines starting with `#` are ignored:
```
# These are my landing pages
https://ocdentalspecialists.com/page1/
# This one is important
https://ocdentalspecialists.com/page2/
```

## Getting Your Landing Page URLs

### From Google Analytics 4:
1. Go to Reports → Engagement → Pages and screens
2. Filter by landing page dimension
3. Export to CSV
4. Copy the page paths to `urls.txt`

### From Google Search Console:
1. Go to Performance → Pages
2. Export the data
3. Copy URLs to `urls.txt`

### From Your CMS:
- WordPress: Export pages/posts, filter for landing pages
- Other CMS: Export sitemap or page list

### From Your Sitemap:
```bash
# Download and parse your sitemap
curl https://ocdentalspecialists.com/sitemap.xml > sitemap.xml
# Extract URLs (you may need to filter manually)
grep -oP '<loc>\K[^<]+' sitemap.xml > urls.txt
```

## Configuration

Edit `audit.js` to customize:

```javascript
const MAX_PAGES = 500; // Increase if you have more pages
const LANDING_MATCH = /(\/landing\/|\/lp\/|\/promo|...)/i; // Add more patterns
```

## Running on a Subset

To test on just a few pages first:

```bash
# Create a small test file
echo "https://ocdentalspecialists.com/appointment-request/" > test-urls.txt
echo "https://ocdentalspecialists.com/contact-us/" >> test-urls.txt

# Run on just those
node audit.js test-urls.txt
```

## Results

All results are saved to `./out/`:
- `summary.csv` - Quick overview of all pages
- `findings.md` - Summary report for your team
- Individual JSON files with detailed evidence

## Tips for Large Sites

1. **Start with a sample**: Test on 10-20 pages first
2. **Use custom URL list**: Faster than auto-discovery
3. **Run overnight**: Large audits can take hours
4. **Check progress**: The tool shows progress as it runs
5. **Review summary.csv**: Quick way to see all issues

## Example Workflow

```bash
# 1. Get your landing page URLs (from GA4, Search Console, etc.)
# 2. Save to urls.txt

# 3. Run the audit
npm start

# 4. Review results
open out/findings.md
open out/summary.csv

# 5. Share with your team
# The findings.md file is ready to hand off!
```

