// API endpoint for running audits via web interface
// Express middleware handler

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { domain, urls, maxPages = 100 } = req.body;

    if (!domain && !urls) {
      return res.status(400).json({ error: 'Domain or URLs required' });
    }

    // Set up Server-Sent Events for progress updates
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const sendProgress = (percent, message) => {
      res.write(`data: ${JSON.stringify({ type: 'progress', percent, message })}\n\n`);
    };

    const sendComplete = (results) => {
      res.write(`data: ${JSON.stringify({ type: 'complete', ...results })}\n\n`);
      res.end();
    };

    const sendError = (message) => {
      res.write(`data: ${JSON.stringify({ type: 'error', message })}\n\n`);
      res.end();
    };

    sendProgress(20, 'Setting up audit...');

    // Create temporary config
    const config = {
      domain: domain || 'https://example.com',
      maxPages: maxPages,
      landingPagePatterns: [
        '/landing/', '/lp/', '/promo', '/special', '/offer', '/book',
        '/contact', '/appointment', '/emergency', '/new-patient'
      ],
      devices: [null, 'iPhone 13']
    };

    const configPath = path.join(__dirname, '..', 'temp-config.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    // Create temporary URLs file if provided
    let urlsFile = null;
    if (urls && urls.length > 0) {
      urlsFile = path.join(__dirname, '..', 'temp-urls.txt');
      fs.writeFileSync(urlsFile, urls.join('\n'));
    }

    sendProgress(30, 'Starting browser and crawling pages...');

    // Build command
    let cmd = `cd ${path.join(__dirname, '..')} && node audit.js`;
    if (urlsFile) {
      cmd += ` ${urlsFile}`;
    }
    cmd += ` --config ${configPath}`;
    if (domain) {
      cmd += ` --domain ${domain}`;
    }

    // Run audit with progress tracking
    const auditProcess = exec(cmd, {
      maxBuffer: 10 * 1024 * 1024, // 10MB
      env: { ...process.env, NODE_ENV: 'production' }
    });

    let lastProgress = 30;

    auditProcess.stdout.on('data', (data) => {
      const output = data.toString();
      
      // Parse progress from console output
      if (output.includes('Auditing')) {
        const match = output.match(/\[(\d+)\/(\d+)\]/);
        if (match) {
          const current = parseInt(match[1]);
          const total = parseInt(match[2]);
          const percent = 30 + Math.floor((current / total) * 60);
          if (percent > lastProgress) {
            lastProgress = percent;
            sendProgress(percent, `Auditing page ${current} of ${total}...`);
          }
        }
      }
    });

    auditProcess.stderr.on('data', (data) => {
      console.error('Audit error:', data.toString());
    });

    auditProcess.on('close', async (code) => {
      if (code !== 0) {
        sendError('Audit failed. Check server logs for details.');
        return;
      }

      sendProgress(90, 'Generating reports...');

      // Wait a moment for files to be written
      await new Promise(resolve => setTimeout(resolve, 2000));

      const outDir = path.join(__dirname, '..', 'out');
      
      // Check if results exist
      const findingsPath = path.join(outDir, 'findings.md');
      const summaryPath = path.join(outDir, 'summary.csv');

      if (!fs.existsSync(findingsPath) || !fs.existsSync(summaryPath)) {
        sendError('Audit completed but results not found.');
        return;
      }

      // Create a unique ID for this audit
      const auditId = Date.now().toString(36);
      const publicDir = path.join(__dirname, '..', 'public', 'results', auditId);
      fs.mkdirSync(publicDir, { recursive: true });

      // Copy results to public directory
      fs.copyFileSync(findingsPath, path.join(publicDir, 'findings.md'));
      fs.copyFileSync(summaryPath, path.join(publicDir, 'summary.csv'));

      // Create ZIP of all JSON files
      const zipPath = path.join(publicDir, 'data.zip');
      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      archive.pipe(output);
      archive.directory(outDir, false);
      await archive.finalize();

      // Clean up temp files
      try {
        if (fs.existsSync(configPath)) fs.unlinkSync(configPath);
        if (urlsFile && fs.existsSync(urlsFile)) fs.unlinkSync(urlsFile);
      } catch (e) {
        // Ignore cleanup errors
      }

      sendComplete({
        findingsUrl: `/results/${auditId}/findings.md`,
        summaryUrl: `/results/${auditId}/summary.csv`,
        jsonUrl: `/results/${auditId}/data.zip`
      });
    });

  } catch (error) {
    console.error('API error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
};
