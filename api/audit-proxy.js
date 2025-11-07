// Vercel serverless function that proxies to Railway/Render backend
// This allows the web interface on Vercel to call the audit API on another service

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get the backend URL from environment variable
  // Set this in Vercel dashboard: Settings → Environment Variables
  const BACKEND_URL = process.env.AUDIT_BACKEND_URL;

  if (!BACKEND_URL) {
    return res.status(500).json({
      error: 'Backend service not configured',
      message: 'Please set AUDIT_BACKEND_URL environment variable in Vercel settings',
      setup: 'Deploy the server.js to Railway or Render, then add the URL to Vercel env vars'
    });
  }

  try {
    // Proxy the request to the backend service
    const response = await fetch(`${BACKEND_URL}/api/audit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    // Stream the response back to the client
    if (!response.ok) {
      const error = await response.text();
      return res.status(response.status).json({ error });
    }

    // Set up Server-Sent Events streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      res.write(chunk);
    }

    res.end();
  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({
      error: 'Failed to connect to audit service',
      message: error.message,
      hint: 'Make sure your backend service (Railway/Render) is running and AUDIT_BACKEND_URL is correct'
    });
  }
}

