// Express Server - AI App Compiler Backend
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const compileRoutes = require('./routes/compileRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    console.log(`${req.method} ${req.path} → ${res.statusCode} [${ms}ms]`);
  });
  next();
});

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/api', compileRoutes);

// Root
app.get('/', (req, res) => {
  res.json({
    name: 'AI App Compiler Backend',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      compile: 'POST /api/compile',
      compileStream: 'POST /api/compile/stream',
      validate: 'POST /api/validate',
      health: 'GET /api/health',
      pipelineInfo: 'GET /api/pipeline/info'
    }
  });
});

// ── Global Error Handler ────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route not found: ${req.method} ${req.path}` });
});

// ── Start ───────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('╔════════════════════════════════════════════╗');
  console.log('║      AI App Compiler Backend  v1.0.0       ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log(`  🚀 Server running on http://localhost:${PORT}`);
  console.log(`  📡 POST http://localhost:${PORT}/api/compile`);
  console.log(`  📡 POST http://localhost:${PORT}/api/compile/stream`);
  console.log(`  💚 GET  http://localhost:${PORT}/api/health`);
  console.log('');
});

module.exports = app;
