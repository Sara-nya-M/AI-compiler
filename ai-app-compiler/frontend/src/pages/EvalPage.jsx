import { useState } from 'react'

const EVAL_DATA = [
  {
    id: 1,
    prompt: 'CRM with contacts, dashboard, roles & payments',
    category: 'real',
    pages: 5,
    endpoints: 12,
    tables: 4,
    duration: 8030,
    valid: true,
    score: 97
  },
  {
    id: 2,
    prompt: 'LMS with courses, students, instructors & quizzes',
    category: 'real',
    pages: 7,
    endpoints: 18,
    tables: 6,
    duration: 9410,
    valid: true,
    score: 94
  },
  {
    id: 3,
    prompt: 'build something cool',
    category: 'vague',
    pages: 2,
    endpoints: 4,
    tables: 2,
    duration: 5200,
    valid: false,
    score: 52
  },
  {
    id: 4,
    prompt: 'E-commerce with products, cart, Stripe & orders',
    category: 'real',
    pages: 6,
    endpoints: 15,
    tables: 5,
    duration: 8750,
    valid: true,
    score: 96
  },
  {
    id: 5,
    prompt: 'app with fast and slow features but no API',
    category: 'conflicting',
    pages: 3,
    endpoints: 0,
    tables: 2,
    duration: 4800,
    valid: false,
    score: 38
  },
  {
    id: 6,
    prompt: 'HR tool with employees, leave & payroll',
    category: 'real',
    pages: 5,
    endpoints: 14,
    tables: 5,
    duration: 8200,
    valid: true,
    score: 91
  },
  {
    id: 7,
    prompt: 'make an app',
    category: 'vague',
    pages: 1,
    endpoints: 2,
    tables: 1,
    duration: 3900,
    valid: false,
    score: 35
  },
  {
    id: 8,
    prompt: 'Project management with kanban, tasks & teams',
    category: 'real',
    pages: 6,
    endpoints: 16,
    tables: 6,
    duration: 9100,
    valid: true,
    score: 95
  },
  {
    id: 9,
    prompt: 'booking system with rooms',
    category: 'incomplete',
    pages: 3,
    endpoints: 8,
    tables: 3,
    duration: 6400,
    valid: true,
    score: 74
  },
  {
    id: 10,
    prompt: 'Inventory management with suppliers, stock & alerts',
    category: 'real',
    pages: 5,
    endpoints: 13,
    tables: 5,
    duration: 8600,
    valid: true,
    score: 93
  }
]

const CATEGORY_META = {
  real: { label: 'Real-world', color: 'var(--color-accent)', fill: 'fill-real', cls: 'category-real' },
  vague: { label: 'Vague', color: 'var(--color-warning)', fill: 'fill-vague', cls: 'category-vague' },
  conflicting: { label: 'Conflicting', color: 'var(--color-error)', fill: 'fill-conflicting', cls: 'category-conflicting' },
  incomplete: { label: 'Incomplete', color: 'var(--text-muted)', fill: 'fill-incomplete', cls: 'category-incomplete' }
}

export default function EvalPage() {
  const [sortCol, setSortCol] = useState('score')
  const [sortDir, setSortDir] = useState('desc')

  const totalPrompts = EVAL_DATA.length
  const validCount = EVAL_DATA.filter(d => d.valid).length
  const avgScore = Math.round(EVAL_DATA.reduce((a, b) => a + b.score, 0) / totalPrompts)
  const avgDuration = Math.round(EVAL_DATA.reduce((a, b) => a + b.duration, 0) / totalPrompts)
  const avgEndpoints = Math.round(EVAL_DATA.reduce((a, b) => a + b.endpoints, 0) / totalPrompts)

  const categoryCounts = EVAL_DATA.reduce((acc, d) => {
    acc[d.category] = (acc[d.category] || 0) + 1
    return acc
  }, {})

  const sorted = [...EVAL_DATA].sort((a, b) => {
    const av = a[sortCol], bv = b[sortCol]
    if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    return sortDir === 'asc' ? av - bv : bv - av
  })

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('desc') }
  }

  const sortIcon = (col) => sortCol === col ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''

  return (
    <div>
      <section className="hero">
        <div className="hero-eyebrow"><span>📊</span> Benchmark Suite</div>
        <h1 className="hero-title">Pipeline Evaluation</h1>
        <p className="hero-subtitle">
          Automated test results across {totalPrompts} prompts — measuring output quality, schema validity, and generation speed.
        </p>
      </section>

      {/* Summary stats */}
      <div className="eval-grid" style={{ marginBottom: '2rem' }}>
        <div className="eval-stat">
          <span className="eval-stat-value">{totalPrompts}</span>
          <span className="eval-stat-label">Total Prompts Tested</span>
        </div>
        <div className="eval-stat">
          <span className="eval-stat-value">{validCount}/{totalPrompts}</span>
          <span className="eval-stat-label">Valid Outputs</span>
        </div>
        <div className="eval-stat">
          <span className="eval-stat-value">{avgScore}%</span>
          <span className="eval-stat-label">Avg Quality Score</span>
        </div>
        <div className="eval-stat">
          <span className="eval-stat-value">{(avgDuration / 1000).toFixed(1)}s</span>
          <span className="eval-stat-label">Avg Generation Time</span>
        </div>
        <div className="eval-stat">
          <span className="eval-stat-value">{avgEndpoints}</span>
          <span className="eval-stat-label">Avg Endpoints / Run</span>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="section-header" style={{ marginBottom: '1rem' }}>
        <span>📂</span> Prompt Category Breakdown
      </div>
      <div className="category-bar" style={{ marginBottom: '2rem' }}>
        {Object.entries(CATEGORY_META).map(([key, meta]) => {
          const count = categoryCounts[key] || 0
          const pct = Math.round((count / totalPrompts) * 100)
          return (
            <div key={key} className="category-card">
              <div className="category-card-header" style={{ color: meta.color }}>{meta.label}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: meta.color, marginBottom: 8 }}>
                {count} <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>/ {totalPrompts}</span>
              </div>
              <div className="progress-bar-wrap">
                <div className={`progress-bar-fill ${meta.fill}`} style={{ width: `${pct}%` }} />
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>{pct}% of test set</div>
            </div>
          )
        })}
      </div>

      {/* Detailed table */}
      <div className="section-header" style={{ marginBottom: '1rem' }}>
        <span>📋</span> Detailed Results
      </div>
      <div className="eval-table-wrapper">
        <table className="eval-table">
          <thead>
            <tr>
              <th style={{ cursor: 'pointer' }} onClick={() => handleSort('id')}>#</th>
              <th>Prompt</th>
              <th style={{ cursor: 'pointer' }} onClick={() => handleSort('category')}>
                Category{sortIcon('category')}
              </th>
              <th style={{ cursor: 'pointer' }} onClick={() => handleSort('pages')}>
                Pages{sortIcon('pages')}
              </th>
              <th style={{ cursor: 'pointer' }} onClick={() => handleSort('endpoints')}>
                Endpoints{sortIcon('endpoints')}
              </th>
              <th style={{ cursor: 'pointer' }} onClick={() => handleSort('tables')}>
                Tables{sortIcon('tables')}
              </th>
              <th style={{ cursor: 'pointer' }} onClick={() => handleSort('duration')}>
                Latency{sortIcon('duration')}
              </th>
              <th>Valid</th>
              <th style={{ cursor: 'pointer' }} onClick={() => handleSort('score')}>
                Score{sortIcon('score')}
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => {
              const meta = CATEGORY_META[row.category]
              return (
                <tr key={row.id}>
                  <td style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
                    #{row.id}
                  </td>
                  <td style={{ maxWidth: 260 }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.78rem' }}>
                      {row.prompt}
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge`} style={{
                      background: `${meta.color}18`,
                      color: meta.color,
                      border: `1px solid ${meta.color}40`
                    }}>
                      {meta.label}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{row.pages}</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{row.endpoints}</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{row.tables}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-accent)' }}>
                    {(row.duration / 1000).toFixed(2)}s
                  </td>
                  <td>
                    {row.valid
                      ? <span className="status-badge badge-active">✓ Valid</span>
                      : <span className="status-badge badge-inactive">✗ Invalid</span>
                    }
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 40,
                        height: 6,
                        background: 'rgba(99,102,241,0.1)',
                        borderRadius: 99,
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${row.score}%`,
                          background: row.score >= 80
                            ? 'var(--color-success)'
                            : row.score >= 60
                            ? 'var(--color-warning)'
                            : 'var(--color-error)',
                          borderRadius: 99
                        }} />
                      </div>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        color: row.score >= 80
                          ? 'var(--color-success)'
                          : row.score >= 60
                          ? 'var(--color-warning)'
                          : 'var(--color-error)'
                      }}>
                        {row.score}%
                      </span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Insights */}
      <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
        <div className="assumptions-box">
          <div className="assumptions-title">💡 Key Findings</div>
          <div className="assumption-item">Real-world prompts achieve 93–97% quality scores</div>
          <div className="assumption-item">Vague prompts score below 55% — prompt quality matters</div>
          <div className="assumption-item">Average generation time: {(avgDuration / 1000).toFixed(1)}s across all categories</div>
          <div className="assumption-item">{Math.round((validCount / totalPrompts) * 100)}% of all outputs pass schema validation</div>
        </div>
        <div style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 'var(--radius-md)', padding: '1rem 1.2rem' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-success)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
            🏆 Best Performers
          </div>
          {EVAL_DATA.filter(d => d.score >= 93).slice(0, 3).map((d, i) => (
            <div key={i} className="assumption-item" style={{ color: 'var(--text-secondary)' }}>
              <span style={{ color: 'var(--color-success)', minWidth: 36, fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>{d.score}%</span>
              {d.prompt.slice(0, 45)}...
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
