// Simple Express server for running the audit tool
// Deploy this to Railway, Render, or similar service

const express = require('express');
const path = require('path');
const fs = require('fs');
const auditHandler = require('./api/audit');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Ensure results directory exists
const resultsDir = path.join(__dirname, 'public', 'results');
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

// API endpoint
app.post('/api/audit', auditHandler);

// Serve results
app.get('/results/:id/:file', (req, res) => {
  const filePath = path.join(__dirname, 'public', 'results', req.params.id, req.params.file);
  if (fs.existsSync(filePath)) {
    if (req.params.file.endsWith('.md')) {
      res.setHeader('Content-Type', 'text/markdown');
    } else if (req.params.file.endsWith('.csv')) {
      res.setHeader('Content-Type', 'text/csv');
    } else if (req.params.file.endsWith('.zip')) {
      res.setHeader('Content-Type', 'application/zip');
    }
    res.sendFile(filePath);
  } else {
    res.status(404).send('File not found');
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Access the tool at http://localhost:${PORT}`);
});

