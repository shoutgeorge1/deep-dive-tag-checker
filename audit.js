// run: node audit.js
const fs = require('fs');
const path = require('path');
const { chromium, devices } = require('playwright');

const DOMAIN = 'https://ocdentalspecialists.com';
const MAX_PAGES = 500; // Increased for more pages
// More flexible landing page patterns - matches more variations
const LANDING_MATCH = /(\/landing\/|\/lp\/|\/promo|\/special|\/offer|\/book|\/contact|\/appointment|\/emergency|\/new-patient|\/locations|\/services|\/treatment|\/procedure|\/about|\/team|\/testimonial|\/review|\/blog\/|\/news\/|\/event)/i;
const GOOGLE_RE = /(googletagmanager|google-analytics|analytics\.google|googleadservices|doubleclick|googlesyndication)\.com/i;

// Support for custom URL list file
const CUSTOM_URLS_FILE = process.argv[2] || 'urls.txt';

const DEVICES = [
  null, // desktop default
  'iPhone 13'
];

function outdir() {
  const d = path.join(__dirname, 'out');
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  return d;
}

async function getSitemapUrls(context) {
  const urls = new Set();
  try {
    const page = await context.newPage();
    await page.goto(`${DOMAIN}/sitemap.xml`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const xml = await page.content();
    
    // Extract all <loc> tags
    const hrefs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/gi)].map(m => m[1]);
    hrefs.forEach(u => {
      if (u.startsWith(DOMAIN) || u.startsWith('http')) {
        const clean = u.split('#')[0].trim();
        if (clean) urls.add(clean);
      }
    });
    
    // Also check for nested sitemaps
    const sitemapRefs = [...xml.matchAll(/<sitemap><loc>([^<]+)<\/loc><\/sitemap>/gi)].map(m => m[1]);
    for (const sitemapUrl of sitemapRefs) {
      try {
        const nestedPage = await context.newPage();
        await nestedPage.goto(sitemapUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
        const nestedXml = await nestedPage.content();
        const nestedHrefs = [...nestedXml.matchAll(/<loc>([^<]+)<\/loc>/gi)].map(m => m[1]);
        nestedHrefs.forEach(u => {
          if (u.startsWith(DOMAIN) || u.startsWith('http')) {
            const clean = u.split('#')[0].trim();
            if (clean) urls.add(clean);
          }
        });
        await nestedPage.close();
      } catch (e) {
        // Skip nested sitemap if it fails
      }
    }
    
    await page.close();
  } catch (e) {
    console.warn('Could not fetch sitemap:', e.message);
  }
  return Array.from(urls);
}

async function crawlLandingUrls(context) {
  const seen = new Set();
  const q = [DOMAIN];
  const collected = new Set();
  let depth = 0;
  const maxDepth = 3; // Increased depth to find more pages

  async function enqueue(url) {
    if (!url.startsWith(DOMAIN)) return;
    const u = url.split('#')[0].split('?')[0];
    if (seen.has(u)) return;
    seen.add(u);
    q.push(u);
  }

  while (q.length && seen.size < 2000 && depth <= maxDepth) { // Increased limit
    const currentLevel = q.length;
    depth++;
    
    for (let i = 0; i < currentLevel && q.length > 0; i++) {
      const url = q.shift();
      if (!url) break;
      
      try {
        const page = await context.newPage();
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
        
        const links = await page.$$eval('a[href]', as => as.map(a => a.href));
        links.forEach(h => {
          if (h.startsWith(DOMAIN)) {
            const clean = h.split('#')[0].split('?')[0];
            if (LANDING_MATCH.test(clean)) {
              collected.add(clean);
            }
            if (depth < maxDepth) {
              enqueue(clean);
            }
          }
        });
        
        await page.close();
      } catch (e) {
        // Skip failed pages
      }
      
      if (collected.size >= MAX_PAGES) break;
    }
    
    if (collected.size >= MAX_PAGES) break;
  }
  
  return Array.from(collected).slice(0, MAX_PAGES);
}

async function patchPage(page, startTs) {
  const networkData = {
    firstGtmMs: null,
    firstGa4Ms: null,
    firstAwMs: null,
    requests: []
  };

  await page.addInitScript(() => {
    window.__gtagCalls = [];
    window.__dlPushes = [];
    
    // Patch dataLayer
    const ensureDL = () => {
      if (!window.dataLayer) {
        window.dataLayer = [];
      }
      if (!window.dataLayer._patched) {
        const origPush = window.dataLayer.push.bind(window.dataLayer);
        window.dataLayer.push = function() {
          try {
            window.__dlPushes.push({
              t: Date.now(),
              args: Array.from(arguments)
            });
          } catch (e) {}
          return origPush.apply(this, arguments);
        };
        window.dataLayer._patched = true;
      }
    };
    
    // Intercept dataLayer creation
    Object.defineProperty(window, 'dataLayer', {
      get() {
        ensureDL();
        return window.__dl || window._datalayer || window.dataLayer;
      },
      set(v) {
        window.__dl = v;
        ensureDL();
      },
      configurable: true
    });
    
    // Patch gtag if it exists, or create a stub
    const origGtag = window.gtag;
    window.gtag = function() {
      try {
        window.__gtagCalls.push({
          t: Date.now(),
          args: Array.from(arguments)
        });
      } catch (e) {}
      if (origGtag) {
        return origGtag.apply(this, arguments);
      }
    };
    
    // Copy properties from original gtag if it exists
    if (origGtag) {
      Object.keys(origGtag).forEach(key => {
        window.gtag[key] = origGtag[key];
      });
    }
  });

  // Set up request monitoring before navigation
  page.on('request', req => {
    const url = req.url();
    if (!GOOGLE_RE.test(url)) return;
    
    const ms = Date.now() - startTs;
    networkData.requests.push({ url, ms, type: 'request' });
    
    if (/gtm\.js/.test(url) && networkData.firstGtmMs === null) {
      networkData.firstGtmMs = ms;
    }
    if (/(google-analytics\.com\/g\/collect|analytics\.google\.com\/g\/collect)/.test(url) && networkData.firstGa4Ms === null) {
      networkData.firstGa4Ms = ms;
    }
    if (/(googleadservices\.com|doubleclick\.net)/.test(url) && networkData.firstAwMs === null) {
      networkData.firstAwMs = ms;
    }
  });

  page.on('response', resp => {
    const url = resp.url();
    if (!GOOGLE_RE.test(url)) return;
    
    const ms = Date.now() - startTs;
    networkData.requests.push({ url, ms, type: 'response', status: resp.status() });
  });

  return () => networkData;
}

function parseIds({ gtagCalls, html }) {
  const gtmIds = Array.from(new Set([...html.matchAll(/GTM-[A-Z0-9]+/gi)].map(m => m[0])));
  // GA4 IDs are G- followed by exactly 10 alphanumeric characters
  const ga4FromHtml = Array.from(new Set([...html.matchAll(/G-[A-Z0-9]{10}/gi)].map(m => m[0])));
  const awFromHtml = Array.from(new Set([...html.matchAll(/AW-\d+/g)].map(m => m[0])));

  const cfgIds = gtagCalls
    .filter(c => c.args && c.args[0] === 'config' && typeof c.args[1] === 'string')
    .map(c => c.args[1]);

  const ga4FromCfg = cfgIds.filter(id => /^G-[A-Z0-9]{10}$/i.test(id));
  const awFromCfg = cfgIds.filter(id => /^AW-\d+$/.test(id));

  const dupGa4 = hasDup(ga4FromCfg);
  const dupAw = hasDup(awFromCfg);

  const ga4HtmlSet = new Set([...ga4FromHtml]);
  const awHtmlSet = new Set([...awFromHtml]);
  const cfgSet = new Set(cfgIds);
  const bothLoaders = [...ga4HtmlSet].some(id => cfgSet.has(id)) || 
                      [...awHtmlSet].some(id => cfgSet.has(id)) ||
                      (gtmIds.length > 0 && cfgIds.length > 0);

  return {
    gtmIds,
    ga4Ids: Array.from(new Set([...ga4FromHtml, ...ga4FromCfg])),
    adsIds: Array.from(new Set([...awFromHtml, ...awFromCfg])),
    dupGa4Config: dupGa4,
    dupAdsConfig: dupAw,
    gtmAndGtagBoth: bothLoaders
  };
}

function hasDup(arr) {
  const c = {};
  for (const x of arr) {
    c[x] = (c[x] || 0) + 1;
  }
  return Object.values(c).some(n => n > 1);
}

function analyzeEvents(gtagCalls, dlPushes) {
  const consentDefaults = gtagCalls.filter(c => 
    c.args && c.args[0] === 'consent' && c.args[1] === 'default'
  );
  const consentUpdates = gtagCalls.filter(c => 
    c.args && c.args[0] === 'consent' && c.args[1] === 'update'
  );

  const pageViews = gtagCalls.filter(c => 
    c.args && c.args[0] === 'event' && c.args[1] === 'page_view'
  );
  const dupPageView = pageViews.length > 1;

  // Check for conversion events
  const convs = gtagCalls.filter(c => {
    if (!c.args || c.args[0] !== 'event') return false;
    const payload = JSON.stringify(c.args).toLowerCase();
    return /purchase|generate_lead|begin_checkout|contact|call|conversion|sign_up|subscribe/i.test(payload);
  });
  const dupConv = convs.length > 1;

  return {
    consentDefault: consentDefaults.length > 0,
    consentUpdated: consentUpdates.length > 0,
    pageViewDupe: dupPageView,
    conversionDupe: dupConv
  };
}

async function detectCallTracking(page) {
  const html = await page.content();
  const callTrackingFound = /callrail|call-tracking|calltracking|twilio|invoca/i.test(html);
  
  // Check for number swap scripts
  const scripts = await page.$$eval('script', scripts => 
    scripts.map(s => s.textContent || s.innerHTML).join('\n')
  );
  const hasNumberSwap = /number.*swap|phone.*swap|dynamic.*number|tracking.*number/i.test(scripts);
  
  return callTrackingFound || hasNumberSwap;
}

async function simulateTelClick(page) {
  try {
    const telLinks = await page.$$('a[href^="tel:"]');
    if (telLinks.length === 0) {
      return { telLinks: 0, callEventSeen: false };
    }

    // Get count of all tel links
    const telCount = await page.$$eval('a[href^="tel:"]', as => as.length);
    
    // Find first visible tel link
    let visibleTel = null;
    for (const tel of telLinks) {
      const isVisible = await tel.isVisible().catch(() => false);
      if (isVisible) {
        visibleTel = tel;
        break;
      }
    }

    if (!visibleTel) {
      return { telLinks: telCount, callEventSeen: false };
    }

    // Scroll into view
    await visibleTel.scrollIntoViewIfNeeded().catch(() => {});
    await page.waitForTimeout(500);

    // Clear prior calls
    await page.evaluate(() => {
      if (window.__gtagCalls) window.__gtagCalls = [];
      if (window.__dlPushes) window.__dlPushes = [];
    });

    // Click the tel link
    await visibleTel.click({ timeout: 2000 }).catch(() => {});
    
    // Wait for potential events
    await page.waitForTimeout(1500);

    // Check for call events
    const calls = await page.evaluate(() => window.__gtagCalls || []);
    const dlPushes = await page.evaluate(() => window.__dlPushes || []);
    
    const allEvents = [...calls, ...dlPushes];
    const callEventSeen = allEvents.some(c => {
      if (!c.args) return false;
      const payload = JSON.stringify(c.args).toLowerCase();
      return payload.includes('call') || 
             payload.includes('phone') || 
             payload.includes('contact') || 
             payload.includes('send_to') ||
             payload.includes('conversion');
    });

    return { telLinks: telCount, callEventSeen };
  } catch (e) {
    return { telLinks: 0, callEventSeen: false };
  }
}

function urlHash(url) {
  // Create a more unique hash using the full URL
  const hash = require('crypto').createHash('md5').update(url).digest('hex');
  return hash.substring(0, 16);
}

async function auditUrl(context, url, deviceLabel) {
  const deviceConfig = deviceLabel && devices[deviceLabel] ? devices[deviceLabel] : undefined;
  const page = await context.newPage(deviceConfig);
  const start = Date.now();
  const captureNetwork = await patchPage(page, start);

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
  } catch (e) {
    // Continue even if navigation fails
  }

  try {
    await page.waitForLoadState('networkidle', { timeout: 8000 });
  } catch (e) {
    // Continue if networkidle times out
  }

  await page.waitForTimeout(2000);

  // Re-patch gtag after page load in case it was loaded by GTM
  await page.evaluate(() => {
    if (window.gtag && !window.gtag._patched) {
      const origGtag = window.gtag;
      window.gtag = function() {
        try {
          if (!window.__gtagCalls) window.__gtagCalls = [];
          window.__gtagCalls.push({
            t: Date.now(),
            args: Array.from(arguments)
          });
        } catch (e) {}
        return origGtag.apply(this, arguments);
      };
      // Copy properties
      Object.keys(origGtag).forEach(key => {
        window.gtag[key] = origGtag[key];
      });
      window.gtag._patched = true;
    }
  });

  const html = await page.content();
  const networkData = captureNetwork();

  const gtagCalls = await page.evaluate(() => window.__gtagCalls || []);
  const dlPushes = await page.evaluate(() => window.__dlPushes || []);

  // Heuristics for deferrers
  const scriptDeferrerDetected =
    /rocket-loader|nitro|perfmatters|optimize|asyncify|lazyload|delay|defer.*script|wp-rocket/i.test(html) ||
    (networkData.firstGtmMs && networkData.firstGtmMs > 1500) ||
    (networkData.firstGa4Ms && networkData.firstGa4Ms > 2500);

  const ids = parseIds({ gtagCalls, html });
  const ev = analyzeEvents(gtagCalls, dlPushes);
  const phone = await simulateTelClick(page);
  const callTracking = await detectCallTracking(page);

  // Save detailed JSON files
  const hash = urlHash(url);
  const deviceSuffix = deviceLabel ? `_${deviceLabel.replace(/\s+/g, '_')}` : '_desktop';
  
  fs.writeFileSync(
    path.join(outdir(), `network_${hash}${deviceSuffix}.json`),
    JSON.stringify(networkData.requests, null, 2)
  );
  
  fs.writeFileSync(
    path.join(outdir(), `datalayer_${hash}${deviceSuffix}.json`),
    JSON.stringify(dlPushes, null, 2)
  );
  
  fs.writeFileSync(
    path.join(outdir(), `gtag_${hash}${deviceSuffix}.json`),
    JSON.stringify(gtagCalls, null, 2)
  );
  
  // Extract consent info
  const consentInfo = {
    defaults: gtagCalls.filter(c => c.args && c.args[0] === 'consent' && c.args[1] === 'default'),
    updates: gtagCalls.filter(c => c.args && c.args[0] === 'consent' && c.args[1] === 'update')
  };
  
  const telLinks = await page.$$eval('a[href^="tel:"]', links => links.map(l => ({
    href: l.href,
    text: l.textContent.trim(),
    visible: l.offsetParent !== null
  }))).catch(() => []);
  
  fs.writeFileSync(
    path.join(outdir(), `dom_${hash}${deviceSuffix}.json`),
    JSON.stringify({
      gtmIds: ids.gtmIds,
      ga4Ids: ids.ga4Ids,
      adsIds: ids.adsIds,
      consentInfo,
      telLinks,
      callTrackingFound: callTracking,
      htmlSnippet: html.substring(0, 5000) // First 5k chars for reference
    }, null, 2)
  );

  await page.close();

  return {
    url,
    device: deviceLabel || 'desktop',
    ...ids,
    ...ev,
    first_gtm_ms: networkData.firstGtmMs,
    first_ga4_ms: networkData.firstGa4Ms,
    first_aw_ms: networkData.firstAwMs,
    script_deferrer_detected: scriptDeferrerDetected,
    tel_links: phone.telLinks,
    call_tracking_found: callTracking,
    call_event_seen: phone.callEventSeen,
    notes: ''
  };
}

function loadCustomUrls() {
  const urls = new Set();
  
  // Try to load from file
  if (fs.existsSync(CUSTOM_URLS_FILE)) {
    console.log(`Loading custom URLs from ${CUSTOM_URLS_FILE}...`);
    const content = fs.readFileSync(CUSTOM_URLS_FILE, 'utf-8');
    const lines = content.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
    
    lines.forEach(line => {
      // Support both plain URLs and JSON arrays
      if (line.startsWith('[')) {
        try {
          const jsonUrls = JSON.parse(line);
          jsonUrls.forEach(u => {
            if (u && typeof u === 'string' && (u.startsWith('http') || u.startsWith('/'))) {
              const fullUrl = u.startsWith('http') ? u : `${DOMAIN}${u}`;
              urls.add(fullUrl.split('#')[0].split('?')[0]);
            }
          });
        } catch (e) {
          // Not valid JSON, treat as plain URL
        }
      } else {
        // Plain URL
        if (line.startsWith('http') || line.startsWith('/')) {
          const fullUrl = line.startsWith('http') ? line : `${DOMAIN}${line}`;
          urls.add(fullUrl.split('#')[0].split('?')[0]);
        }
      }
    });
    
    console.log(`Loaded ${urls.size} custom URLs from file`);
  }
  
  return Array.from(urls);
}

async function main() {
  console.log('Starting OC Dental tag audit...');
  console.log(`Using custom URLs file: ${CUSTOM_URLS_FILE}`);
  const outputDir = outdir();
  console.log(`Output directory: ${outputDir}`);

  // Load custom URLs first
  const customUrls = loadCustomUrls();
  
  const browser = await chromium.launch({ headless: true });
  const baseContext = await browser.newContext();

  let landing = [];
  
  if (customUrls.length > 0) {
    // If custom URLs provided, use those (optionally filter by pattern)
    console.log(`Using ${customUrls.length} custom URLs`);
    landing = customUrls.slice(0, MAX_PAGES);
  } else {
    // Otherwise, discover URLs
    console.log('Fetching sitemap...');
    const sitemap = await getSitemapUrls(baseContext);
    console.log(`Found ${sitemap.length} URLs in sitemap`);

    console.log('Crawling landing pages...');
    const discoveredLanding = await crawlLandingUrls(baseContext);
    console.log(`Discovered ${discoveredLanding.length} landing pages via crawl`);

    landing = Array.from(new Set([
      ...sitemap.filter(u => LANDING_MATCH.test(u)),
      ...discoveredLanding,
      ...customUrls // Include custom URLs even if we're also discovering
    ])).slice(0, MAX_PAGES);
  }

  console.log(`Total unique landing pages to audit: ${landing.length}`);

  fs.writeFileSync(
    path.join(outputDir, 'landing_urls.json'),
    JSON.stringify(landing, null, 2)
  );

  const rows = [];
  let processed = 0;
  const total = landing.length * DEVICES.length;

  for (const url of landing) {
    for (const device of DEVICES) {
      processed++;
      const deviceLabel = device || 'desktop';
      console.log(`[${processed}/${total}] Auditing ${url} [${deviceLabel}]`);
      
      try {
        const deviceConfig = device && devices[device] ? devices[device] : undefined;
        const context = await browser.newContext(deviceConfig);
        const r = await auditUrl(context, url, device);
        rows.push(r);
        await context.close();
      } catch (e) {
        console.error(`Error auditing ${url} [${deviceLabel}]:`, e.message);
        rows.push({
          url,
          device: deviceLabel,
          gtmIds: [],
          ga4Ids: [],
          adsIds: [],
          gtmAndGtagBoth: false,
          dupGa4Config: false,
          dupAdsConfig: false,
          pageViewDupe: false,
          conversionDupe: false,
          consentDefault: false,
          consentUpdated: false,
          first_gtm_ms: null,
          first_ga4_ms: null,
          first_aw_ms: null,
          script_deferrer_detected: false,
          tel_links: 0,
          call_tracking_found: false,
          call_event_seen: false,
          notes: 'error: ' + (e && e.message || 'unknown')
        });
      }
    }
  }

  // Write summary.csv
  const headers = [
    'url', 'device', 'gtm_ids', 'ga4_ids', 'ads_ids',
    'gtm_and_gtag_both', 'dup_ga4_config', 'dup_ads_config',
    'page_view_dupe', 'conversion_dupe', 'consent_default', 'consent_updated',
    'first_gtm_ms', 'first_ga4_ms', 'first_aw_ms', 'script_deferrer_detected',
    'tel_links', 'call_tracking_found', 'call_event_seen', 'notes'
  ];

  const escapeCsv = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  };

  const lines = [headers.join(',')];
  for (const r of rows) {
    lines.push([
      escapeCsv(r.url),
      escapeCsv(r.device),
      escapeCsv(JSON.stringify(r.gtmIds || [])),
      escapeCsv(JSON.stringify(r.ga4Ids || [])),
      escapeCsv(JSON.stringify(r.adsIds || [])),
      escapeCsv(r.gtmAndGtagBoth || false),
      escapeCsv(r.dupGa4Config || false),
      escapeCsv(r.dupAdsConfig || false),
      escapeCsv(r.pageViewDupe || false),
      escapeCsv(r.conversionDupe || false),
      escapeCsv(r.consentDefault || false),
      escapeCsv(r.consentUpdated || false),
      escapeCsv(r.first_gtm_ms ?? ''),
      escapeCsv(r.first_ga4_ms ?? ''),
      escapeCsv(r.first_aw_ms ?? ''),
      escapeCsv(r.script_deferrer_detected || false),
      escapeCsv(r.tel_links ?? 0),
      escapeCsv(r.call_tracking_found || false),
      escapeCsv(r.call_event_seen || false),
      escapeCsv(r.notes || '')
    ].join(','));
  }

  fs.writeFileSync(path.join(outputDir, 'summary.csv'), lines.join('\n'));

  // Generate findings.md
  const badBoth = rows.filter(r => r.gtmAndGtagBoth);
  const dupGa4 = rows.filter(r => r.dupGa4Config);
  const dupAds = rows.filter(r => r.dupAdsConfig);
  const late = rows.filter(r => r.script_deferrer_detected);
  const noCall = rows.filter(r => (r.tel_links || 0) > 0 && !r.call_event_seen);
  const noConsentUpdate = rows.filter(r => r.consentDefault && !r.consentUpdated);
  const dupPageView = rows.filter(r => r.pageViewDupe);
  const dupConversion = rows.filter(r => r.conversionDupe);

  function exampleBlock(title, arr) {
    if (arr.length === 0) return `### ${title}\n- None found\n`;
    const unique = Array.from(new Set(arr.map(r => r.url))).slice(0, 2);
    const sample = unique.map(url => {
      const examples = arr.filter(r => r.url === url).slice(0, 1);
      return examples.map(r => `- ${r.url} [${r.device}]`).join('\n');
    }).join('\n');
    return `### ${title}\n${sample}\n`;
  }

  const md = [
    '# OC Dental Tag Audit Findings',
    '',
    `**Audit Date:** ${new Date().toISOString()}`,
    `**Total landing pages checked:** ${landing.length} pages × 2 devices = ${rows.length} device-views`,
    '',
    '## Summary of Issues',
    '',
    `- **GTM + hardcoded gtag on same page:** ${badBoth.length} device-views`,
    `- **Duplicate GA4 config:** ${dupGa4.length} device-views`,
    `- **Duplicate Ads config:** ${dupAds.length} device-views`,
    `- **Duplicate page_view events:** ${dupPageView.length} device-views`,
    `- **Duplicate conversion events:** ${dupConversion.length} device-views`,
    `- **Consent Mode defaulted but never updated:** ${noConsentUpdate.length} device-views`,
    `- **Possible script deferrer/late loads:** ${late.length} device-views`,
    `- **Phone links found but no call event fired:** ${noCall.length} device-views`,
    '',
    '## Minimal Fix Plan',
    '',
    '### 1. Remove Duplicate Tag Loaders',
    '**Issue:** GTM and hardcoded gtag snippets both loading the same IDs',
    '**Fix:** Keep GTM only. Remove hardcoded GA4/AW gtag snippets from theme/plugins.',
    '**Impact:** Prevents double-counting and reduces page load time.',
    '',
    '### 2. Fix Duplicate Configurations',
    '**Issue:** Same GA4 or Ads ID configured multiple times',
    '**Fix:** Ensure each ID is configured exactly once, preferably in GTM.',
    '**Impact:** Prevents duplicate events and data quality issues.',
    '',
    '### 3. Fix Duplicate Events',
    '**Issue:** `page_view` or conversion events firing multiple times per page load',
    '**Fix:** GA4: fire exactly one `page_view` per load; if SPA, fire on route change only. Ads conversions: fire once with explicit `send_to`; do not piggyback on `page_view`.',
    '**Impact:** Accurate conversion tracking and reporting.',
    '',
    '### 4. Fix Consent Mode',
    '**Issue:** Consent Mode defaults to denied but never updates to granted',
    '**Fix:** Implement proper consent banner that calls `gtag(\'consent\', \'update\', {...})` when user accepts.',
    '**Impact:** Enables proper data collection after consent.',
    '',
    '### 5. Fix Script Loading Delays',
    '**Issue:** GTM or gtag scripts delayed by deferrers/optimizers',
    '**Fix:** Place GTM in `<head>` and `<noscript>` in `<body>`; disable any tag deferral affecting GTM/gtag (Rocket Loader, Nitro, etc.).',
    '**Impact:** Ensures tags fire early enough to capture all user interactions.',
    '',
    '### 6. Wire Phone Call Tracking',
    '**Issue:** `tel:` links present but no conversion events fire on click',
    '**Fix:** Ensure `tel:` clicks dispatch a GA4 event marked as conversion or AW event with correct `send_to`. Verify CallRail number swap and that the phone number is visible on mobile.',
    '**Impact:** Proper attribution of phone call conversions.',
    '',
    '## Example URLs by Issue',
    '',
    exampleBlock('GTM + gtag both present', badBoth),
    exampleBlock('Duplicate GA4 config', dupGa4),
    exampleBlock('Duplicate Ads config', dupAds),
    exampleBlock('Duplicate page_view events', dupPageView),
    exampleBlock('Duplicate conversion events', dupConversion),
    exampleBlock('Consent defaulted but not updated', noConsentUpdate),
    exampleBlock('Late or deferred scripts', late),
    exampleBlock('No call event on tel click', noCall),
    '',
    '## Next Steps',
    '',
    '1. Review `summary.csv` for page-by-page details',
    '2. Check individual JSON files in `./out/` for specific evidence',
    '3. Prioritize fixes based on conversion impact',
    '4. Test fixes in staging before deploying to production',
    ''
  ].join('\n');

  fs.writeFileSync(path.join(outputDir, 'findings.md'), md);

  console.log('\n✅ Audit complete!');
  console.log(`📊 Results saved to: ${outputDir}`);
  console.log(`   - summary.csv: ${rows.length} rows`);
  console.log(`   - findings.md: Summary report`);
  console.log(`   - Individual JSON files for each page/device combination`);

  await baseContext.close();
  await browser.close();
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});

