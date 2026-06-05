// API Routes - /api/compile and related endpoints
const express = require('express');
const router = express.Router();
const { runPipeline, PIPELINE_VERSION } = require('../pipeline/orchestrator');

// POST /api/compile
// Main endpoint: takes a natural language prompt, returns full AppConfig JSON
router.post('/compile', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Missing required field: prompt (non-empty string)'
    });
  }

  if (prompt.trim().length > 5000) {
    return res.status(400).json({
      success: false,
      error: 'Prompt too long: max 5000 characters'
    });
  }

  const stageUpdates = [];
  const onStageUpdate = (update) => {
    stageUpdates.push({ ...update, timestamp: new Date().toISOString() });
  };

  try {
    const result = await runPipeline(prompt.trim(), onStageUpdate);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
        runId: result.runId,
        totalMs: result.totalMs
      });
    }

    return res.status(200).json({
      success: true,
      runId: result.runId,
      totalMs: result.totalMs,
      stageTimings: result.stageTimings,
      stageUpdates,
      summary: result.pipelineSummary,
      config: result.config
    });
  } catch (err) {
    console.error('Pipeline error:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal pipeline error: ' + err.message
    });
  }
});

// POST /api/compile/stream
// Streaming version using SSE (Server-Sent Events) for real-time stage progress
router.post('/compile/stream', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return res.status(400).json({ success: false, error: 'Missing required field: prompt' });
  }

  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const sendEvent = (eventType, data) => {
    res.write(`event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  const onStageUpdate = (update) => {
    sendEvent('stage', { ...update, timestamp: new Date().toISOString() });
  };

  try {
    sendEvent('start', { message: 'Pipeline started', timestamp: new Date().toISOString() });
    const result = await runPipeline(prompt.trim(), onStageUpdate);

    if (result.success) {
      sendEvent('complete', {
        success: true,
        runId: result.runId,
        totalMs: result.totalMs,
        summary: result.pipelineSummary,
        config: result.config
      });
    } else {
      sendEvent('error', { success: false, error: result.error, runId: result.runId });
    }
  } catch (err) {
    sendEvent('error', { success: false, error: err.message });
  } finally {
    res.end();
  }
});

// GET /api/health
// Health check endpoint
router.get('/health', (req, res) => {
  const { isGeminiAvailable } = require('../services/geminiService');
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    pipelineVersion: PIPELINE_VERSION,
    aiEnabled: isGeminiAvailable(),
    uptime: process.uptime()
  });
});

// GET /api/pipeline/info
// Returns info about the pipeline stages
router.get('/pipeline/info', (req, res) => {
  res.json({
    pipelineVersion: PIPELINE_VERSION,
    stages: [
      { id: 1, name: 'Intent Extraction', description: 'NLP parsing of user prompt into structured IntentSpec' },
      { id: 2, name: 'System Design', description: 'Converts IntentSpec to AppBlueprint with entity graph, flows, and roles' },
      { id: 3, name: 'Schema Generation', description: 'Generates UI pages, API endpoints, DB tables, and Auth config' },
      { id: 4, name: 'Refinement', description: 'Cross-validates all schemas and repairs inconsistencies' },
      { id: 5, name: 'Validation & Repair', description: 'Final contract validation with up to 3 auto-repair attempts' },
      { id: 0, name: 'AI Enhancement', description: 'Optional Gemini AI enrichment with insights and recommendations' }
    ],
    supportedAppTypes: ['crm', 'ecommerce', 'lms', 'hr', 'analytics', 'project', 'healthcare', 'finance', 'social', 'inventory', 'general'],
    supportedFeatures: ['auth', 'rbac', 'payments', 'search', 'notifications', 'analytics', 'fileUpload', 'api', 'realtime', 'export']
  });
});

// POST /api/validate
// Validate an existing AppConfig JSON against the schema
router.post('/validate', (req, res) => {
  const { config } = req.body;
  if (!config || typeof config !== 'object') {
    return res.status(400).json({ success: false, error: 'Missing required field: config (object)' });
  }
  const { validateAppConfig } = require('../schemas/appConfigSchema');
  const result = validateAppConfig(config);
  res.json({ success: true, ...result });
});

// POST /api/generate  (alias for /compile/stream — matches frontend expectations)
router.post('/generate', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return res.status(400).json({ success: false, error: 'Missing required field: prompt' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const sendEvent = (eventType, data) => {
    res.write(`event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  const onStageUpdate = (update) => {
    // Map stage 0 (AI) to be included in stage updates
    sendEvent('stage', { ...update, timestamp: new Date().toISOString() });
  };

  try {
    sendEvent('start', { message: 'Pipeline started', prompt: prompt.slice(0, 100), timestamp: new Date().toISOString() });
    const result = await runPipeline(prompt.trim(), onStageUpdate);
    if (result.success) {
      sendEvent('complete', {
        success: true,
        runId: result.runId,
        totalMs: result.totalMs,
        metrics: {
          totalDuration: result.totalMs,
          endpointCount: result.pipelineSummary.endpointsCount,
          tableCount: result.pipelineSummary.tablesCount,
          pageCount: result.pipelineSummary.pagesCount,
          isValid: result.pipelineSummary.isValid,
          validationErrors: result.config?.validation?.errors?.length || 0,
          repairAttempts: result.config?.validation?.repairAttempts || 0,
          aiEnhanced: result.pipelineSummary.aiEnhanced
        },
        config: result.config
      });
    } else {
      sendEvent('error', { success: false, error: result.error });
    }
  } catch (err) {
    sendEvent('error', { success: false, error: err.message });
  } finally {
    res.end();
  }
});

// Evaluation dataset (20 prompts)
const EVALUATION_DATASET = [
  { id: 'eval_01', category: 'real', name: 'CRM System', prompt: 'Build a CRM with login, contacts, dashboard, role-based access, and premium plan with payments. Admins can see analytics.' },
  { id: 'eval_02', category: 'real', name: 'E-commerce Store', prompt: 'Create an e-commerce platform with product catalog, shopping cart, checkout with Stripe payments, order management, and admin panel with inventory tracking.' },
  { id: 'eval_03', category: 'real', name: 'LMS', prompt: 'Build an LMS with student and instructor roles. Instructors create courses with lessons. Students enroll, track progress, and take quizzes. Premium courses require payment.' },
  { id: 'eval_04', category: 'real', name: 'Project Management', prompt: 'Create a project management app like Jira. Teams create projects, tasks, and sprints. Tasks have kanban view, assignees, due dates, and priority. Managers see reports.' },
  { id: 'eval_05', category: 'real', name: 'HR System', prompt: 'Build an HR system for managing employees, departments, leave requests, and payroll. HR admins can approve leave, view analytics, and export reports.' },
  { id: 'eval_06', category: 'real', name: 'Healthcare Appointments', prompt: 'Create a healthcare app where patients book appointments with doctors. Doctors manage schedules, view patient history, and write prescriptions. Admin manages all users.' },
  { id: 'eval_07', category: 'real', name: 'SaaS Analytics', prompt: 'Build a multi-tenant SaaS analytics platform with team workspaces, custom dashboards, data visualizations, user management, and tiered subscription plans.' },
  { id: 'eval_08', category: 'real', name: 'Inventory Management', prompt: 'Create an inventory system with product catalog, stock tracking, supplier management, purchase orders, and low stock alerts. Role-based for managers and staff.' },
  { id: 'eval_09', category: 'real', name: 'Community Forum', prompt: 'Build a community forum with user registration, post creation, comments, categories, upvotes, moderator controls, and user reputation system.' },
  { id: 'eval_10', category: 'real', name: 'Finance Tool', prompt: 'Create a finance tool where users create invoices, track expenses, manage clients, view financial reports, and export to PDF. Has free and premium tiers.' },
  { id: 'eval_11', category: 'vague', name: 'Vague: Team Tool', prompt: 'Build something for my team' },
  { id: 'eval_12', category: 'vague', name: 'Vague: Dashboard', prompt: 'I need a dashboard' },
  { id: 'eval_13', category: 'vague', name: 'Very Short', prompt: 'App' },
  { id: 'eval_14', category: 'conflicting', name: 'Free + Premium Conflict', prompt: 'Build a completely free app with premium features and no login needed but have an admin panel with user management' },
  { id: 'eval_15', category: 'conflicting', name: 'Simple + Enterprise', prompt: 'Build a simple one-page app that handles enterprise-level analytics, multi-tenancy, SSO, and GDPR compliance' },
  { id: 'eval_16', category: 'conflicting', name: 'Auth Conflict', prompt: 'No login required. Public app. But each user has their own private data and admin can manage users' },
  { id: 'eval_17', category: 'incomplete', name: 'No Entities', prompt: 'Build a web application with a nice UI and good performance' },
  { id: 'eval_18', category: 'incomplete', name: 'One Feature Only', prompt: 'Build a login system' },
  { id: 'eval_19', category: 'incomplete', name: 'Partial CRM', prompt: 'CRM with contacts' },
  { id: 'eval_20', category: 'incomplete', name: 'Just a Name', prompt: 'Build Salesforce' }
];

// GET /api/evaluation/dataset
router.get('/evaluation/dataset', (req, res) => {
  res.json({ dataset: EVALUATION_DATASET, total: EVALUATION_DATASET.length });
});

// POST /api/evaluate  (SSE streaming evaluation run)
router.post('/evaluate', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const send = (event, data) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

  send('start', { total: EVALUATION_DATASET.length });

  const results = [];
  const startTime = Date.now();

  for (let i = 0; i < EVALUATION_DATASET.length; i++) {
    const tc = EVALUATION_DATASET[i];
    const caseStart = Date.now();
    let repairAttempts = 0;

    try {
      const result = await runPipeline(tc.prompt, (update) => {
        if (update.stage === 5 && update.status !== 'running') {
          // capture repair count when available
        }
      });
      const latencyMs = Date.now() - caseStart;
      repairAttempts = result.config?.validation?.repairAttempts || 0;
      results.push({
        ...tc, success: true, latencyMs, repairAttempts,
        isValid: result.pipelineSummary?.isValid,
        pageCount: result.pipelineSummary?.pagesCount,
        endpointCount: result.pipelineSummary?.endpointsCount,
        tableCount: result.pipelineSummary?.tablesCount,
        entityCount: result.pipelineSummary?.entitiesCount,
        validationErrors: result.config?.validation?.errors?.length || 0,
        failureType: null
      });
    } catch (err) {
      results.push({ ...tc, success: false, latencyMs: Date.now() - caseStart, repairAttempts, isValid: false, validationErrors: 1, failureType: 'pipeline_error', error: err.message });
    }

    send('progress', { completed: i + 1, total: EVALUATION_DATASET.length, current: tc.name });
  }

  const successCount = results.filter(r => r.success).length;
  const validCount = results.filter(r => r.isValid).length;
  const totalRepairs = results.reduce((s, r) => s + (r.repairAttempts || 0), 0);
  const avgLatency = Math.round(results.reduce((s, r) => s + r.latencyMs, 0) / results.length);
  const byCategory = {};
  results.forEach(r => {
    if (!byCategory[r.category]) byCategory[r.category] = { total: 0, success: 0, latencyTotal: 0 };
    byCategory[r.category].total++;
    if (r.success) byCategory[r.category].success++;
    byCategory[r.category].latencyTotal += r.latencyMs;
  });
  Object.keys(byCategory).forEach(cat => {
    byCategory[cat].avgLatency = Math.round(byCategory[cat].latencyTotal / byCategory[cat].total);
    byCategory[cat].successRate = ((byCategory[cat].success / byCategory[cat].total) * 100).toFixed(1) + '%';
    delete byCategory[cat].latencyTotal;
  });

  send('complete', {
    summary: {
      totalTests: results.length, successCount, validCount,
      successRate: ((successCount / results.length) * 100).toFixed(1) + '%',
      validRate: ((validCount / results.length) * 100).toFixed(1) + '%',
      totalRepairs, avgRepairsPerRequest: (totalRepairs / results.length).toFixed(2),
      avgLatencyMs: avgLatency, totalDurationMs: Date.now() - startTime,
      byCategory
    },
    results
  });

  res.end();
});

module.exports = router;
