# Google Tag Audit Tool

A comprehensive, automated tool to audit Google Tag Manager (GTM), Google Analytics 4 (GA4), and Google Ads tracking across your website's landing pages. Detects duplicate tags, missing conversions, script loading issues, and phone call tracking problems.

## ✨ Features

- **Comprehensive URL Discovery**: Fetches sitemap.xml, crawls internal links, or uses your custom URL list
- **Dual Device Testing**: Tests each page on both desktop and mobile
- **Tag Detection**: Identifies GTM, GA4, and Google Ads IDs from HTML and JavaScript
- **Duplicate Detection**: Finds duplicate tag configurations and event fires
- **Network Monitoring**: Tracks timing of first GTM, GA4, and Ads requests
- **Consent Mode Analysis**: Detects Consent Mode defaults and updates
- **Phone Call Tracking**: Verifies tel: links and call conversion events
- **Script Deferrer Detection**: Identifies performance optimizers that delay tag loading
- **Flexible Configuration**: Works for any website with configurable patterns

## 🚀 Quick Start

### Installation

```bash
npm install
npx playwright install chromium
```

### Basic Usage

```bash
# Auto-discover landing pages
npm start

# Use your own URL list
npm start my-urls.txt

# Specify a domain
npm start -- --domain example.com

# Use a config file
npm start -- --config config.json
```

## 📋 Configuration

### Option 1: Command Line Arguments

```bash
node audit.js urls.txt --domain example.com --config config.json
```

### Option 2: Config File (Recommended)

Create a `config.json` file:

```json
{
  "domain": "https://example.com",
  "maxPages": 500,
  "landingPagePatterns": [
    "/landing/",
    "/lp/",
    "/contact",
    "/appointment"
  ],
  "knownIds": {
    "gtm": ["GTM-XXXXXXX"],
    "ga4": ["G-XXXXXXXXXX"],
    "ads": ["AW-XXXXXXXXX"]
  },
  "devices": [null, "iPhone 13"]
}
```

See `config.example.json` for a complete example.

### Option 3: URL List File

Create a `urls.txt` file with one URL per line:

```
https://example.com/page1/
https://example.com/page2/
/contact-us/
```

## 📊 Output Files

All results are saved to the `./out` directory:

### `summary.csv`
Page-by-page summary with all detected issues

### `findings.md`
Handoff-ready summary report with:
- Issue counts and impact
- Minimal fix steps for developers
- Example URLs for each issue type

### Individual JSON Files (per page/device)
- `network_{hash}_{device}.json`: All Google-related network requests
- `datalayer_{hash}_{device}.json`: All dataLayer.push() calls
- `gtag_{hash}_{device}.json`: All gtag() function calls
- `dom_{hash}_{device}.json`: DOM analysis including IDs, consent info, tel links

## 🔍 What Gets Audited

1. **Duplicate Tag Loaders**: GTM + hardcoded gtag on same page
2. **Duplicate Configurations**: Same GA4 or Ads ID configured multiple times
3. **Duplicate Events**: Multiple page_view or conversion events
4. **Consent Mode Issues**: Defaulted but never updated
5. **Script Loading Delays**: Deferrers/optimizers delaying tags
6. **Phone Call Tracking**: tel: links without conversion events
7. **Network Timing**: Time to first GTM, GA4, and Ads requests

## 🎯 Use Cases

- **Marketing Teams**: Verify conversion tracking is working correctly
- **Web Developers**: Identify and fix tag implementation issues
- **SEO Agencies**: Audit client websites for tracking problems
- **E-commerce Sites**: Ensure purchase and conversion events fire correctly
- **Lead Generation**: Verify phone call and form submission tracking

## 📖 Examples

### Audit a specific domain

```bash
node audit.js --domain mysite.com
```

### Use custom landing page patterns

```json
{
  "landingPagePatterns": [
    "/product/",
    "/checkout/",
    "/thank-you"
  ]
}
```

### Get URLs from Google Analytics

1. Export landing pages from GA4
2. Save to `urls.txt`
3. Run: `npm start urls.txt`

## 🛠️ Advanced Usage

### Custom Device Testing

Edit `config.json`:

```json
{
  "devices": [
    null,
    "iPhone 13",
    "iPad Pro",
    "Desktop Chrome"
  ]
}
```

### Increase Page Limit

```json
{
  "maxPages": 1000
}
```

### Watch for Specific IDs

```json
{
  "knownIds": {
    "gtm": ["GTM-ABC123"],
    "ga4": ["G-XYZ789"],
    "ads": ["AW-123456"]
  }
}
```

## 📚 Documentation

- **`USAGE.md`**: Detailed usage instructions
- **`QUICK_START.md`**: Quick setup guide
- **`DEPLOYMENT.md`**: Deployment options (GitHub Actions, Vercel, etc.)

## 🤝 Contributing

This tool is designed to be generic and work for any website. Feel free to:
- Add more landing page patterns
- Improve detection algorithms
- Add support for other analytics platforms

## 📝 License

MIT

## 🙏 Credits

Originally built for OC Dental, now generalized for any website.
