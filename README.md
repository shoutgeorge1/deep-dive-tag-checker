# OC Dental Tag Audit Tool

Comprehensive Google Tag audit crawler for OC Dental landing pages. This tool crawls all landing pages on `ocdentalspecialists.com`, identifies Google Tag Manager (GTM), Google Analytics 4 (GA4), and Google Ads tracking issues, and verifies phone call conversion tracking.

## Features

- **Comprehensive URL Discovery**: Fetches sitemap.xml, crawls internal links, and filters landing pages
- **Dual Device Testing**: Tests each page on both desktop and mobile (iPhone 13)
- **Tag Detection**: Identifies GTM, GA4, and Google Ads IDs from HTML and JavaScript
- **Duplicate Detection**: Finds duplicate tag configurations and event fires
- **Network Monitoring**: Tracks timing of first GTM, GA4, and Ads requests
- **Consent Mode Analysis**: Detects Consent Mode defaults and updates
- **Phone Call Tracking**: Verifies tel: links and call conversion events
- **Script Deferrer Detection**: Identifies performance optimizers that delay tag loading

## Prerequisites

- Node.js 18 or higher
- npm or yarn

## Installation

```bash
npm install
```

This will install Playwright and its browser dependencies.

## Usage

```bash
npm start
# or
node audit.js
```

The audit will:
1. Fetch and parse sitemap.xml
2. Crawl the site to discover landing pages
3. Audit each landing page on desktop and mobile
4. Generate reports in the `./out` directory

## Output Files

All results are saved to the `./out` directory:

### `landing_urls.json`
Complete list of all landing pages that were audited.

### `summary.csv`
Page-by-page summary with columns:
- `url`: Page URL
- `device`: desktop or iPhone 13
- `gtm_ids`: Array of GTM container IDs found
- `ga4_ids`: Array of GA4 measurement IDs found
- `ads_ids`: Array of Google Ads conversion IDs found
- `gtm_and_gtag_both`: Boolean - both GTM and hardcoded gtag present
- `dup_ga4_config`: Boolean - duplicate GA4 configurations detected
- `dup_ads_config`: Boolean - duplicate Ads configurations detected
- `page_view_dupe`: Boolean - multiple page_view events fired
- `conversion_dupe`: Boolean - multiple conversion events fired
- `consent_default`: Boolean - Consent Mode defaulted
- `consent_updated`: Boolean - Consent Mode updated
- `first_gtm_ms`: Milliseconds until first GTM request
- `first_ga4_ms`: Milliseconds until first GA4 request
- `first_aw_ms`: Milliseconds until first Ads request
- `script_deferrer_detected`: Boolean - script deferrer detected
- `tel_links`: Number of tel: links found
- `call_tracking_found`: Boolean - call tracking service detected
- `call_event_seen`: Boolean - call event fired on tel: click
- `notes`: Additional notes or errors

### Individual JSON Files (per page/device)
- `network_{hash}_{device}.json`: All Google-related network requests with timestamps
- `datalayer_{hash}_{device}.json`: All dataLayer.push() calls
- `gtag_{hash}_{device}.json`: All gtag() function calls
- `dom_{hash}_{device}.json`: DOM analysis including IDs, consent info, tel links

### `findings.md`
Handoff-ready summary report with:
- Issue counts and impact
- Minimal fix steps for developers
- Example URLs for each issue type

## Known IDs to Watch

The tool specifically watches for:
- **GTM**: `GTM-W77KHST`
- **GA4**: `G-MQDHL2Y4YF`, `G-VK6W65HQRE`
- **Ads**: `AW-721294688`

## Landing Page Patterns

Pages matching these URL patterns are considered landing pages:
- `/landing/`
- `/lp/`
- `/promo`
- `/special`
- `/offer`
- `/book`
- `/contact`
- `/appointment`
- `/emergency`
- `/new-patient`

## Configuration

Edit `audit.js` to modify:
- `DOMAIN`: Target domain (default: `https://ocdentalspecialists.com`)
- `MAX_PAGES`: Maximum pages to audit (default: 200)
- `LANDING_MATCH`: Regex pattern for landing page URLs
- `DEVICES`: Array of devices to test (default: desktop + iPhone 13)

## Troubleshooting

**Playwright browsers not installed:**
```bash
npx playwright install chromium
```

**Timeout errors:**
- Some pages may be slow to load. The tool will continue with other pages if one fails.
- Check `notes` column in summary.csv for error details.

**Memory issues with large sites:**
- Reduce `MAX_PAGES` in audit.js
- Process pages in smaller batches

## License

MIT

