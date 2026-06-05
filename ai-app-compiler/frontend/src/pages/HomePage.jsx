import { useState, useRef, useEffect } from 'react'
import PipelineVisualizer from '../components/PipelineVisualizer'
import SchemaViewer from '../components/SchemaViewer'
import AppRenderer from '../components/AppRenderer'
import ValidationReport from '../components/ValidationReport'
import AIEnhancementsPanel from '../components/AIEnhancementsPanel'

const EXAMPLE_PROMPTS = [
  'CRM with contacts, dashboard, roles & payments',
  'LMS with courses, students, instructors & quizzes',
  'E-commerce with products, cart, Stripe & orders',
  'HR tool with employees, leave & payroll',
  'Project management with kanban, tasks & teams'
]

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'

const INITIAL_STAGES = [
  { id: 1, name: 'Intent Extraction', icon: '🔍', status: 'idle', message: 'Parse natural language intent', duration: null },
  { id: 2, name: 'System Design', icon: '🏗️', status: 'idle', message: 'Generate app architecture', duration: null },
  { id: 3, name: 'Schema Generation', icon: '⚙️', status: 'idle', message: 'Generate UI/API/DB/Auth schemas', duration: null },
  { id: 4, name: 'Refinement', icon: '🔗', status: 'idle', message: 'Cross-validate schemas', duration: null },
  { id: 5, name: 'Validation & Repair', icon: '🛡️', status: 'idle', message: 'Validate and repair output', duration: null }
]

export default function HomePage() {
  const [prompt, setPrompt] = useState('CRM with contacts, dashboard, roles & payments')
  const [stages, setStages] = useState(INITIAL_STAGES)
  const [logs, setLogs] = useState([])
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState(null)
  const [activeOutputTab, setActiveOutputTab] = useState('runtime')
  const logRef = useRef(null)

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [logs])

  const addLog = (stage, status, message) => {
    const time = new Date().toLocaleTimeString('en', { hour12: false })
    setLogs(prev => [...prev, { time, stage, status, message }])
  }

  const updateStage = (stageData) => {
    if (stageData.stage < 1) return
    setStages(prev => prev.map(s =>
      s.id === stageData.stage
        ? { ...s, status: stageData.status, message: stageData.message, duration: stageData.ms || stageData.duration }
        : s
    ))
    addLog(`Stage ${stageData.stage}`, stageData.status, stageData.message)
  }

  const handleGenerate = async () => {
    if (!prompt.trim() || isRunning) return

    setIsRunning(true)
    setResult(null)
    setStages(INITIAL_STAGES)
    setLogs([])
    setActiveOutputTab('runtime')

    addLog('System', 'running', `Starting pipeline for: "${prompt.slice(0, 60)}${prompt.length > 60 ? '...' : ''}"`)

    try {
      const response = await fetch(`${BACKEND_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      })

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        // SSE events are separated by double newlines
        const eventBlocks = buffer.split('\n\n')
        buffer = eventBlocks.pop() // keep incomplete block

        for (const block of eventBlocks) {
          if (!block.trim()) continue
          let eventType = 'message'
          let dataStr = ''
          for (const line of block.split('\n')) {
            if (line.startsWith('event: ')) eventType = line.slice(7).trim()
            else if (line.startsWith('data: ')) dataStr = line.slice(6).trim()
          }
          if (!dataStr) continue
          try {
            const data = JSON.parse(dataStr)
            if (eventType === 'stage') {
              updateStage(data)
            } else if (eventType === 'complete') {
              setResult(data)
              addLog('Pipeline', 'done', `✅ Complete! Generated ${data.metrics?.endpointCount} endpoints, ${data.metrics?.tableCount} tables`)
            } else if (eventType === 'error') {
              addLog('Error', 'error', data.error || 'Pipeline error')
            } else if (eventType === 'start') {
              addLog('Pipeline', 'running', data.message || 'Pipeline started')
            } else if (data.stage !== undefined) {
              updateStage(data)
            } else if (data.config) {
              setResult(data)
            }
          } catch (e) { /* skip malformed */ }
        }
      }
    } catch (err) {
      addLog('Network', 'error', `Cannot connect to backend (${BACKEND_URL}). Is the backend running?`)
      // Show demo result when backend is offline
      setResult(DEMO_RESULT)
      setStages(DEMO_STAGES)
      addLog('Demo', 'done', '✅ Showing demo output (backend offline)')
    } finally {
      setIsRunning(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate()
  }

  const outputTabs = [
    { id: 'runtime', label: '🖥️ Live Preview', show: true },
    { id: 'ui', label: '🎨 UI Schema', show: !!result },
    { id: 'api', label: '🔌 API Schema', show: !!result },
    { id: 'db', label: '🗄️ DB Schema', show: !!result },
    { id: 'auth', label: '🔐 Auth Schema', show: !!result },
    { id: 'full', label: '📄 Full Config', show: !!result },
    { id: 'validation', label: '🛡️ Validation', show: !!result }
  ]

  return (
    <div>
      {/* Hero */}
      <section className="hero">
        <div className="hero-eyebrow">
          <span>⚡</span> Multi-Stage Compiler Pipeline
        </div>
        <h1 className="hero-title">Natural Language → Working App</h1>
        <p className="hero-subtitle">
          A compiler-like system that converts your description into validated UI, API, DB, and Auth configurations — ready to execute.
        </p>
      </section>

      {/* Input */}
      <section className="input-section">
        <div className="prompt-label">
          <span>📝</span> Describe your application
        </div>
        <div className="prompt-wrapper">
          <textarea
            id="prompt-input"
            className="prompt-textarea"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Build a CRM with login, contacts, dashboard, role-based access, and premium plan with payments. Admins can see analytics."
            disabled={isRunning}
          />
          <div className="prompt-actions">
            <span className="char-count">{prompt.length} chars · Ctrl+Enter to run</span>
            <button
              id="generate-btn"
              className="btn btn-primary"
              onClick={handleGenerate}
              disabled={isRunning || !prompt.trim()}
            >
              {isRunning ? (
                <><div className="spinner" /> Compiling...</>
              ) : (
                <>⚡ Compile App</>
              )}
            </button>
          </div>
        </div>

        {/* Example prompts */}
        <div className="example-prompts" style={{ marginTop: '0.75rem' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Try:</span>
          {EXAMPLE_PROMPTS.map((ex, i) => (
            <button key={i} className="example-chip" onClick={() => setPrompt(ex)}>{ex}</button>
          ))}
        </div>
      </section>

      {/* Pipeline Visualizer */}
      <PipelineVisualizer stages={stages} logs={logs} logRef={logRef} />

      {/* Output Tabs */}
      {(result || isRunning) && (
        <section className="output-section">
          {result && (
            <div className="output-header">
              <div className="output-title">
                <span>✅</span> Generated: <strong>{result.config?.metadata?.appName}</strong>
              </div>
              <div className="metrics-bar">
                <div className="metric-chip success"><span>Pages</span><span className="metric-value">{result.metrics?.pageCount}</span></div>
                <div className="metric-chip"><span>Endpoints</span><span className="metric-value">{result.metrics?.endpointCount}</span></div>
                <div className="metric-chip"><span>Tables</span><span className="metric-value">{result.metrics?.tableCount}</span></div>
                <div className="metric-chip"><span>Latency</span><span className="metric-value">{result.metrics?.totalDuration}ms</span></div>
                <div className={`metric-chip ${result.metrics?.validationErrors > 0 ? 'warn' : 'success'}`}>
                  <span>Valid</span><span className="metric-value">{result.metrics?.isValid ? '✓' : '⚠'}</span>
                </div>
              </div>
            </div>
          )}

          <div className="schema-tabs-wrapper">
            <div className="schema-tab-bar">
              {outputTabs.filter(t => t.show).map(tab => (
                <button
                  key={tab.id}
                  id={`tab-${tab.id}`}
                  className={`schema-tab ${activeOutputTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveOutputTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="schema-content">
              {activeOutputTab === 'runtime' && (
                <AppRenderer config={result?.config} isLoading={isRunning} />
              )}
              {activeOutputTab === 'validation' && result && (
                <ValidationReport config={result.config} />
              )}
              {activeOutputTab === 'ui' && result && (
                <SchemaViewer data={result.config?.ui} />
              )}
              {activeOutputTab === 'api' && result && (
                <SchemaViewer data={result.config?.api} />
              )}
              {activeOutputTab === 'db' && result && (
                <SchemaViewer data={result.config?.db} />
              )}
              {activeOutputTab === 'auth' && result && (
                <SchemaViewer data={result.config?.auth} />
              )}
              {activeOutputTab === 'full' && result && (
                <SchemaViewer data={result.config} />
              )}
            </div>
          </div>

          {/* Assumptions */}
          {result?.config?.businessLogic?.assumptions?.length > 0 && (
            <div className="assumptions-box">
              <div className="assumptions-title">📋 Pipeline Assumptions & Decisions</div>
              {result.config.businessLogic.assumptions.map((a, i) => (
                <div key={i} className="assumption-item">{a}</div>
              ))}
            </div>
          )}

          {/* AI Enhancements */}
          {result?.config?.aiEnhancements && (
            <AIEnhancementsPanel enhancements={result.config.aiEnhancements} />
          )}
        </section>
      )}

      {/* Initial Empty State */}
      {!result && !isRunning && (
        <div className="empty-state">
          <div className="empty-icon">⚡</div>
          <div className="empty-title">Ready to compile your app</div>
          <div className="empty-subtitle">Enter a description above and click Compile App</div>
        </div>
      )}
    </div>
  )
}

/* ===== Demo data shown when backend is offline ===== */
const DEMO_STAGES = [
  { id: 1, name: 'Intent Extraction', icon: '🔍', status: 'done', message: 'Extracted: CRM, contacts, dashboard, roles, payments', duration: 1240 },
  { id: 2, name: 'System Design', icon: '🏗️', status: 'done', message: 'Designed: 5 pages, REST API, PostgreSQL', duration: 2380 },
  { id: 3, name: 'Schema Generation', icon: '⚙️', status: 'done', message: 'Generated: UI, API, DB, Auth schemas', duration: 3100 },
  { id: 4, name: 'Refinement', icon: '🔗', status: 'done', message: 'Linked: 12 endpoints to 4 tables', duration: 890 },
  { id: 5, name: 'Validation & Repair', icon: '🛡️', status: 'done', message: '✅ All schemas valid, 0 errors', duration: 420 }
]

const DEMO_RESULT = {
  metrics: { pageCount: 5, endpointCount: 12, tableCount: 4, totalDuration: 8030, isValid: true, validationErrors: 0 },
  config: {
    metadata: { appName: 'CRM Pro', version: '1.0.0', description: 'Customer relationship management with contacts, dashboard, roles and payments', appType: 'web', framework: 'react' },
    ui: {
      theme: { primaryColor: '#6366f1', darkMode: true },
      pages: [
        { name: 'Dashboard', route: '/dashboard', isPublic: false, icon: '⊞', allowedRoles: ['admin', 'manager', 'user'] },
        { name: 'Contacts', route: '/contacts', isPublic: false, icon: '👥', allowedRoles: ['admin', 'manager', 'user'] },
        { name: 'Analytics', route: '/analytics', isPublic: false, icon: '📊', allowedRoles: ['admin', 'manager'] },
        { name: 'Billing', route: '/billing', isPublic: false, icon: '💳', allowedRoles: ['admin'] },
        { name: 'Users', route: '/users', isPublic: false, icon: '👤', allowedRoles: ['admin'] }
      ]
    },
    api: {
      baseUrl: '/api/v1',
      endpoints: [
        { method: 'GET', path: '/contacts', description: 'List all contacts', auth: true },
        { method: 'POST', path: '/contacts', description: 'Create contact', auth: true },
        { method: 'PUT', path: '/contacts/:id', description: 'Update contact', auth: true },
        { method: 'DELETE', path: '/contacts/:id', description: 'Delete contact', auth: true },
        { method: 'GET', path: '/analytics/summary', description: 'Get analytics', auth: true },
        { method: 'GET', path: '/users', description: 'List users', auth: true },
        { method: 'POST', path: '/users', description: 'Create user', auth: true },
        { method: 'GET', path: '/billing/plans', description: 'List plans', auth: false },
        { method: 'POST', path: '/billing/subscribe', description: 'Subscribe to plan', auth: true },
        { method: 'POST', path: '/auth/login', description: 'Login', auth: false },
        { method: 'POST', path: '/auth/register', description: 'Register', auth: false },
        { method: 'POST', path: '/auth/logout', description: 'Logout', auth: true }
      ]
    },
    db: {
      engine: 'postgresql',
      tables: [
        { name: 'users', displayName: 'Users', columns: [{ name: 'id', type: 'uuid' }, { name: 'name', type: 'varchar' }, { name: 'email', type: 'varchar' }, { name: 'role', type: 'varchar' }, { name: 'created_at', type: 'timestamp' }] },
        { name: 'contacts', displayName: 'Contacts', columns: [{ name: 'id', type: 'uuid' }, { name: 'name', type: 'varchar' }, { name: 'email', type: 'varchar' }, { name: 'company', type: 'varchar' }, { name: 'status', type: 'varchar' }] },
        { name: 'billing_plans', displayName: 'Billing', columns: [{ name: 'id', type: 'uuid' }, { name: 'name', type: 'varchar' }, { name: 'price', type: 'decimal' }, { name: 'active', type: 'boolean' }] },
        { name: 'analytics_events', displayName: 'Analytics', columns: [{ name: 'id', type: 'uuid' }, { name: 'event', type: 'varchar' }, { name: 'user_id', type: 'uuid' }, { name: 'created_at', type: 'timestamp' }] }
      ]
    },
    auth: {
      strategy: 'jwt',
      sessionDuration: '24h',
      roles: [
        { name: 'admin', permissions: ['*'] },
        { name: 'manager', permissions: ['contacts:*', 'analytics:read'] },
        { name: 'user', permissions: ['contacts:read', 'contacts:create'] }
      ]
    },
    businessLogic: {
      assumptions: [
        'JWT tokens stored in httpOnly cookies for security',
        'Role-based access enforced both on frontend routes and API middleware',
        'Stripe used for payment processing with webhook support',
        'Soft-delete pattern used for contacts (archived, not deleted)',
        'Admin dashboard shows aggregated analytics from all users'
      ]
    }
  }
}
