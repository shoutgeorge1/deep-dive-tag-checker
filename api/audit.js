// Vercel serverless function wrapper for the audit
// Note: Playwright requires special setup on Vercel - consider using @sparticuz/chromium
// For full Playwright support, deploy to Railway.app or Render.com instead

// For now, this is a placeholder - Playwright on Vercel requires special configuration
// See: https://github.com/microsoft/playwright/issues/6315

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    // Note: Running Playwright in Vercel serverless functions is complex
    // You may want to:
    // 1. Use a separate service (Railway, Render, etc.) for the crawler
    // 2. Or use Puppeteer with @sparticuz/chromium for Vercel
    // 3. Or trigger the audit via GitHub Actions
    
    return res.status(200).json({
      message: 'Audit API endpoint',
      note: 'Playwright requires special setup on Vercel. Consider using a dedicated server or GitHub Actions for running audits.',
      alternatives: [
        'Deploy to Railway.app or Render.com for full Playwright support',
        'Use GitHub Actions to run audits on schedule',
        'Convert to Puppeteer with @sparticuz/chromium for Vercel compatibility'
      ]
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

