# Usage Examples

## For Different Industries

### E-commerce Store

```bash
# Create config
cat > config.json << EOF
{
  "domain": "https://mystore.com",
  "landingPagePatterns": [
    "/product/",
    "/category/",
    "/checkout/",
    "/cart",
    "/thank-you"
  ],
  "knownIds": {
    "gtm": ["GTM-ABC123"],
    "ga4": ["G-XYZ789"],
    "ads": ["AW-123456"]
  }
}
EOF

# Run audit
npm start
```

### Healthcare/Medical Practice

```bash
cat > config.json << EOF
{
  "domain": "https://medicalpractice.com",
  "landingPagePatterns": [
    "/appointment",
    "/contact",
    "/services",
    "/locations",
    "/new-patient"
  ]
}
EOF

npm start
```

### Real Estate

```bash
cat > config.json << EOF
{
  "domain": "https://realestate.com",
  "landingPagePatterns": [
    "/listings",
    "/property",
    "/contact",
    "/schedule-tour",
    "/neighborhoods"
  ]
}
EOF

npm start
```

### SaaS/Software Company

```bash
cat > config.json << EOF
{
  "domain": "https://saascompany.com",
  "landingPagePatterns": [
    "/pricing",
    "/features",
    "/signup",
    "/demo",
    "/trial"
  ]
}
EOF

npm start
```

## Quick Command Examples

### Audit a specific domain

```bash
node audit.js --domain example.com
```

### Use custom URL list

```bash
# Create urls.txt with your pages
echo "https://example.com/page1/" > urls.txt
echo "https://example.com/page2/" >> urls.txt

# Run audit
npm start urls.txt
```

### Combine options

```bash
node audit.js my-urls.txt --domain example.com --config my-config.json
```

## Getting URLs from Different Sources

### Google Analytics 4

1. Go to Reports → Engagement → Pages and screens
2. Add filter: Page path contains "landing" (or your pattern)
3. Export to CSV
4. Copy URLs to `urls.txt`

### Google Search Console

1. Go to Performance → Pages
2. Export data
3. Filter for landing pages
4. Copy to `urls.txt`

### WordPress Site

```bash
# Export sitemap
curl https://yoursite.com/sitemap.xml > sitemap.xml

# Extract URLs
grep -oP '<loc>\K[^<]+' sitemap.xml | grep -E "(landing|lp|contact)" > urls.txt
```

### Shopify Store

1. Go to Online Store → Navigation
2. Export pages
3. Filter for landing pages
4. Copy URLs to `urls.txt`

## Common Configurations

### Multiple Devices

```json
{
  "devices": [
    null,
    "iPhone 13",
    "iPad Pro",
    "Galaxy S21"
  ]
}
```

### Large Site (1000+ pages)

```json
{
  "maxPages": 1000,
  "landingPagePatterns": [
    "/landing/",
    "/lp/",
    "/promo"
  ]
}
```

### Watch for Specific Tag IDs

```json
{
  "knownIds": {
    "gtm": ["GTM-ABC123", "GTM-XYZ789"],
    "ga4": ["G-1234567890", "G-0987654321"],
    "ads": ["AW-123456789", "AW-987654321"]
  }
}
```

