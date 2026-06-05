export default function ValidationReport({ config }) {
  if (!config) return null

  const errors = []
  const warnings = []
  const infos = []
  const successes = []

  // Check UI
  const pages = config?.ui?.pages || []
  const endpoints = config?.api?.endpoints || []
  const tables = config?.db?.tables || []
  const roles = config?.auth?.roles || []

  if (pages.length > 0) {
    successes.push({ path: 'ui.pages', msg: `${pages.length} pages generated successfully` })
  } else {
    errors.push({ path: 'ui.pages', msg: 'No UI pages were generated' })
  }

  if (endpoints.length > 0) {
    successes.push({ path: 'api.endpoints', msg: `${endpoints.length} API endpoints generated` })
  } else {
    errors.push({ path: 'api.endpoints', msg: 'No API endpoints generated' })
  }

  if (tables.length > 0) {
    successes.push({ path: 'db.tables', msg: `${tables.length} database tables defined` })
  } else {
    errors.push({ path: 'db.tables', msg: 'No database tables defined' })
  }

  if (roles.length > 0) {
    successes.push({ path: 'auth.roles', msg: `${roles.length} roles defined: ${roles.map(r => r.name).join(', ')}` })
  } else {
    warnings.push({ path: 'auth.roles', msg: 'No roles defined — defaulting to single-user auth' })
  }

  // Check for auth strategy
  if (config?.auth?.strategy) {
    successes.push({ path: 'auth.strategy', msg: `Auth strategy: ${config.auth.strategy.toUpperCase()}` })
  } else {
    warnings.push({ path: 'auth.strategy', msg: 'Auth strategy not specified' })
  }

  // Check DB engine
  if (config?.db?.engine) {
    infos.push({ path: 'db.engine', msg: `Database engine: ${config.db.engine}` })
  }

  // Check public vs protected pages
  const publicPages = pages.filter(p => p.isPublic)
  const protectedPages = pages.filter(p => !p.isPublic)
  if (publicPages.length > 0) {
    infos.push({ path: 'ui.pages', msg: `${publicPages.length} public pages, ${protectedPages.length} protected pages` })
  }

  // Check for dashboard
  const hasDashboard = pages.some(p => p.name.toLowerCase() === 'dashboard')
  if (!hasDashboard) {
    warnings.push({ path: 'ui.pages', msg: 'No Dashboard page found — consider adding one' })
  }

  // Check for DELETE endpoints
  const hasDelete = endpoints.some(e => e.method === 'DELETE')
  if (!hasDelete) {
    infos.push({ path: 'api.endpoints', msg: 'No DELETE endpoints — soft-delete may be used' })
  }

  const isValid = errors.length === 0
  const allItems = [
    ...errors.map(i => ({ ...i, type: 'error' })),
    ...warnings.map(i => ({ ...i, type: 'warning' })),
    ...infos.map(i => ({ ...i, type: 'info' })),
    ...successes.map(i => ({ ...i, type: 'success' }))
  ]

  const icons = { error: '❌', warning: '⚠️', info: 'ℹ️', success: '✅' }

  return (
    <div className="validation-panel">
      <div className="validation-header">
        <div className={`validation-status ${isValid ? 'status-valid' : 'status-invalid'}`}>
          {isValid ? '✅ All Checks Passed' : `❌ ${errors.length} Error${errors.length > 1 ? 's' : ''} Found`}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {errors.length > 0 && <span style={{ color: 'var(--color-error)' }}>{errors.length} errors</span>}
          {warnings.length > 0 && <span style={{ color: 'var(--color-warning)' }}>{warnings.length} warnings</span>}
          {successes.length > 0 && <span style={{ color: 'var(--color-success)' }}>{successes.length} passed</span>}
        </div>
      </div>

      <div className="validation-body">
        {allItems.map((item, i) => (
          <div key={i} className={`validation-item ${item.type}`}>
            <span className="vi-icon">{icons[item.type]}</span>
            <div>
              <div className="vi-path">{item.path}</div>
              <div className="vi-msg">{item.msg}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
