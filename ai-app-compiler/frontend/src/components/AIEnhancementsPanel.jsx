export default function AIEnhancementsPanel({ enhancements }) {
  if (!enhancements) return null

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.08))',
      border: '1px solid rgba(99,102,241,0.3)',
      borderRadius: 'var(--radius-lg)',
      padding: '1.5rem',
      marginTop: '1.5rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.2rem' }}>
        <span style={{ fontSize: '1.2rem' }}>✨</span>
        <span style={{
          fontWeight: 800,
          fontSize: '1rem',
          background: 'linear-gradient(135deg, #818cf8, #a78bfa)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          Gemini AI Enhancements
        </span>
        <span style={{
          fontSize: '0.65rem',
          padding: '2px 8px',
          background: 'rgba(99,102,241,0.15)',
          border: '1px solid rgba(99,102,241,0.3)',
          borderRadius: 99,
          color: 'var(--color-primary-light)'
        }}>
          gemini-2.0-flash
        </span>
      </div>

      {enhancements.appDescription && (
        <p style={{
          fontSize: '0.875rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.7,
          marginBottom: '1.2rem'
        }}>
          {enhancements.appDescription}
        </p>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '1rem'
      }}>
        {enhancements.keyFeatures?.length > 0 && (
          <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
            <div style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              color: 'var(--color-accent)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '0.5rem'
            }}>
              Key Features
            </div>
            {enhancements.keyFeatures.map((f, i) => (
              <div key={i} style={{
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
                padding: '3px 0',
                display: 'flex',
                gap: 8
              }}>
                <span style={{ color: 'var(--color-success)' }}>✓</span>{f}
              </div>
            ))}
          </div>
        )}

        {enhancements.technicalRecommendations?.length > 0 && (
          <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
            <div style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              color: 'var(--color-primary-light)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '0.5rem'
            }}>
              Technical Recommendations
            </div>
            {enhancements.technicalRecommendations.map((r, i) => (
              <div key={i} style={{
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
                padding: '3px 0',
                display: 'flex',
                gap: 8
              }}>
                <span style={{ color: 'var(--color-primary-light)' }}>→</span>{r}
              </div>
            ))}
          </div>
        )}

        {enhancements.securityConsiderations?.length > 0 && (
          <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
            <div style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              color: 'var(--color-warning)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '0.5rem'
            }}>
              Security Considerations
            </div>
            {enhancements.securityConsiderations.map((s, i) => (
              <div key={i} style={{
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
                padding: '3px 0',
                display: 'flex',
                gap: 8
              }}>
                <span style={{ color: 'var(--color-warning)' }}>🛡️</span>{s}
              </div>
            ))}
          </div>
        )}

        {(enhancements.estimatedComplexity || enhancements.estimatedBuildTime) && (
          <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
            <div style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '0.5rem'
            }}>
              Estimates
            </div>
            {enhancements.estimatedComplexity && (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '3px 0' }}>
                Complexity: <strong style={{ color: 'var(--color-accent)' }}>{enhancements.estimatedComplexity}</strong>
              </div>
            )}
            {enhancements.estimatedBuildTime && (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '3px 0' }}>
                Build Time: <strong style={{ color: 'var(--color-accent)' }}>{enhancements.estimatedBuildTime}</strong>
              </div>
            )}
            {enhancements.costEstimate && (
              <>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '3px 0' }}>
                  Infra: {enhancements.costEstimate.infrastructure}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '3px 0' }}>
                  Dev: {enhancements.costEstimate.development}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {enhancements.scalabilityNotes && (
        <div style={{
          marginTop: '1rem',
          padding: '0.75rem 1rem',
          background: 'rgba(6,182,212,0.05)',
          border: '1px solid rgba(6,182,212,0.2)',
          borderRadius: 'var(--radius-sm)'
        }}>
          <span style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            color: 'var(--color-accent)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em'
          }}>
            Scalability:{' '}
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {enhancements.scalabilityNotes}
          </span>
        </div>
      )}
    </div>
  )
}
