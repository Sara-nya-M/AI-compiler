import { useState } from 'react'

const PAGE_ICONS = {
  Dashboard: '⊞',
  Login: '🔒',
  Register: '👤',
  Profile: '👤',
  Contacts: '👥',
  Products: '📦',
  Orders: '🛒',
  Analytics: '📊',
  Users: '👥',
  Billing: '💳',
  Tasks: '✅',
  Courses: '📚',
  Employees: '💼',
  Inventory: '📦',
  Messages: '💬',
  Reports: '📈',
  Settings: '⚙️',
  Kanban: '📋'
}

function DashboardView({ config, role }) {
  const tables = config?.db?.tables || []
  const endpoints = config?.api?.endpoints || []

  return (
    <div>
      <div className="page-title">
        <span>⊞</span> Dashboard
        <span style={{
          marginLeft: 'auto',
          fontSize: '0.7rem',
          padding: '3px 10px',
          background: 'rgba(99,102,241,0.1)',
          border: '1px solid var(--border)',
          borderRadius: 99,
          color: 'var(--color-primary-light)'
        }}>
          {role}
        </span>
      </div>

      <div className="stats-grid">
        {tables.slice(0, 4).map((table, i) => (
          <div key={i} className="stat-card">
            <div className="stat-label">{table.displayName || table.name}</div>
            <div className="stat-value">{[247, 583, 129, 42][i % 4]}</div>
            <div className="stat-trend">↑ {[12, 8, 23, 5][i % 4]}% this month</div>
          </div>
        ))}
        {tables.length === 0 && (
          <>
            <div className="stat-card">
              <div className="stat-label">Total Records</div>
              <div className="stat-value">1,284</div>
              <div className="stat-trend">↑ 14% this month</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Active Users</div>
              <div className="stat-value">342</div>
              <div className="stat-trend">↑ 7% this month</div>
            </div>
          </>
        )}
        <div className="stat-card">
          <div className="stat-label">API Endpoints</div>
          <div className="stat-value">{endpoints.length || 0}</div>
          <div className="stat-trend">↑ Auto-generated</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">DB Tables</div>
          <div className="stat-value">{tables.length || 0}</div>
          <div className="stat-trend">↑ Normalized</div>
        </div>
      </div>

      <div className="chart-placeholder">
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>
          ACTIVITY — Last 7 Days
        </div>
        <div className="chart-bar-group">
          {[65, 72, 55, 88, 95, 78, 91].map((h, i) => (
            <div
              key={i}
              className="chart-bar"
              style={{ height: `${h}%` }}
              title={`Day ${i + 1}: ${h} events`}
            />
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
            <span key={d} style={{ fontSize: '0.6rem', color: 'var(--text-muted)', flex: 1, textAlign: 'center' }}>{d}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

function TableView({ page, config }) {
  const tables = config?.db?.tables || []
  const relevantTable = tables.find(t =>
    t.displayName?.toLowerCase() === page.name.toLowerCase() ||
    t.name.toLowerCase().startsWith(page.name.toLowerCase().slice(0, -1)) ||
    t.name.toLowerCase() === page.name.toLowerCase()
  ) || tables[0]

  const SAMPLE_DATA = [
    { status: 'active', id: 'rec_001', name: 'Alice Johnson', email: 'alice@acme.com', role: 'admin', amount: '$2,400.00', date: '2024-01-15' },
    { status: 'active', id: 'rec_002', name: 'Bob Smith', email: 'bob@corp.io', role: 'manager', amount: '$1,100.50', date: '2024-01-16' },
    { status: 'pending', id: 'rec_003', name: 'Carol Davis', email: 'carol@ltd.co', role: 'user', amount: '$880.00', date: '2024-01-17' },
  ]

  const cols = relevantTable?.columns?.slice(0, 5) || []

  const renderCell = (col, row) => {
    if (col.name === 'id') return <code style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{row.id}</code>
    if (col.name === 'name') return row.name
    if (col.name === 'email') return row.email
    if (col.name === 'role') return <span className="status-badge badge-premium">{row.role}</span>
    if (col.type === 'boolean') return Math.random() > 0.5 ? '✓' : '—'
    if (col.type === 'timestamp' || col.name.includes('date') || col.name.includes('_at')) return row.date
    if (col.type === 'decimal' || col.name.includes('price') || col.name.includes('amount')) return row.amount
    return '—'
  }

  return (
    <div>
      <div className="page-title">
        <span>{PAGE_ICONS[page.name] || '📄'}</span> {page.name}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm">🔍 Search</button>
          <button className="btn btn-ghost btn-sm">⬇️ Export</button>
          <button className="btn btn-primary btn-sm">+ Add New</button>
        </div>
      </div>

      {cols.length > 0 ? (
        <table className="data-table">
          <thead>
            <tr>
              {cols.map(col => (
                <th key={col.name}>{col.name.replace(/_/g, ' ').toUpperCase()}</th>
              ))}
              <th>STATUS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {SAMPLE_DATA.map((row, i) => (
              <tr key={i}>
                {cols.map((col, ci) => (
                  <td key={ci}>{renderCell(col, row)}</td>
                ))}
                <td>
                  <span className={`status-badge ${
                    row.status === 'active' ? 'badge-active' :
                    row.status === 'pending' ? 'badge-pending' :
                    'badge-inactive'
                  }`}>
                    {row.status}
                  </span>
                </td>
                <td>
                  <button className="btn btn-ghost btn-sm" style={{ marginRight: 4 }}>✏️</button>
                  <button className="btn btn-ghost btn-sm">🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="empty-state">
          <div className="empty-subtitle">No schema columns found for this page</div>
        </div>
      )}
    </div>
  )
}

function AnalyticsView({ config }) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
  const values = [42, 67, 55, 88, 72, 95]

  return (
    <div>
      <div className="page-title"><span>📊</span> Analytics</div>
      <div className="stats-grid">
        {[
          { label: 'Total Revenue', value: '$48,291', trend: '+18%' },
          { label: 'Active Sessions', value: '3,421', trend: '+5%' },
          { label: 'Conversion Rate', value: '4.7%', trend: '+1.2%' },
          { label: 'Avg Response', value: '142ms', trend: '-22ms' }
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ fontSize: '1.2rem' }}>{s.value}</div>
            <div className="stat-trend">{s.trend} this month</div>
          </div>
        ))}
      </div>
      <div className="chart-placeholder">
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>MONTHLY REVENUE</div>
        <div className="chart-bar-group">
          {values.map((h, i) => (
            <div key={i} className="chart-bar" style={{ height: `${h}%` }} title={`${months[i]}: ${h}k`} />
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          {months.map(m => (
            <span key={m} style={{ fontSize: '0.6rem', color: 'var(--text-muted)', flex: 1, textAlign: 'center' }}>{m}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function AppRenderer({ config, isLoading }) {
  const [activePage, setActivePage] = useState(0)
  const [role, setRole] = useState('')

  const pages = config?.ui?.pages?.filter(p => !p.isPublic) || []
  const roles = config?.auth?.roles?.map(r => r.name) || []
  const currentRole = role || roles[0] || 'user'
  const appName = config?.metadata?.appName || 'Generated App'
  const currentPage = pages[activePage]

  if (isLoading && !config) {
    return (
      <div className="empty-state" style={{ padding: '3rem' }}>
        <div className="spinner" style={{ margin: '0 auto 1rem', width: 32, height: 32, borderWidth: 3 }} />
        <div className="empty-title">Generating app configuration...</div>
        <div className="empty-subtitle">Running 5-stage compiler pipeline</div>
      </div>
    )
  }

  if (!config) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🖥️</div>
        <div className="empty-title">Live App Preview</div>
        <div className="empty-subtitle">Your generated app will render here after compilation</div>
      </div>
    )
  }

  const renderPageContent = () => {
    if (!currentPage) return null
    const name = currentPage.name
    if (name === 'Dashboard') return <DashboardView config={config} role={currentRole} />
    if (name === 'Analytics' || name === 'Reports') return <AnalyticsView config={config} />
    return <TableView page={currentPage} config={config} />
  }

  return (
    <div className="runtime-wrapper">
      <div className="runtime-header">
        <div className="browser-bar">
          <div className="browser-dots">
            <div className="browser-dot dot-red" />
            <div className="browser-dot dot-yellow" />
            <div className="browser-dot dot-green" />
          </div>
          <div className="browser-url">
            localhost:3000{currentPage?.route || '/'}
          </div>
        </div>
        <div className="runtime-role-switcher">
          <span className="role-label">Viewing as:</span>
          <select
            id="role-switcher"
            className="role-select"
            value={currentRole}
            onChange={e => setRole(e.target.value)}
          >
            {roles.length > 0
              ? roles.map(r => <option key={r} value={r}>{r}</option>)
              : <option value="user">user</option>
            }
          </select>
        </div>
      </div>

      <div className="rendered-app">
        <aside className="app-sidebar">
          <div className="app-sidebar-title">{appName}</div>
          {pages.map((page, i) => (
            <div
              key={i}
              className={`nav-item ${activePage === i ? 'active' : ''}`}
              onClick={() => setActivePage(i)}
            >
              <span className="nav-icon">{PAGE_ICONS[page.name] || '📄'}</span>
              {page.name}
            </div>
          ))}
          {pages.length === 0 && (
            <div style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              No pages generated
            </div>
          )}
        </aside>

        <main className="app-main">
          {renderPageContent() || (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <div className="empty-subtitle">Select a page from the sidebar</div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
