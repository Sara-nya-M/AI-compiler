export default function PipelineVisualizer({ stages, logs, logRef }) {
  const hasActivity = stages.some(s => s.status !== 'idle')
  if (!hasActivity) return null

  return (
    <section className="pipeline-section">
      <div className="section-header">
        <span>⚡</span> Pipeline Progress
      </div>
      <div className="pipeline-stages">
        {stages.map(stage => (
          <div key={stage.id} className={`pipeline-stage ${stage.status}`}>
            <span className="stage-number">Stage {stage.id}</span>
            <div className="stage-icon">
              {stage.status === 'done' ? '✅' : stage.status === 'error' ? '❌' : stage.icon}
            </div>
            <div className="stage-name">{stage.name}</div>
            <div className="stage-message">{stage.message}</div>
            {stage.duration && (
              <div className="stage-duration">{stage.duration}ms</div>
            )}
          </div>
        ))}
      </div>

      {logs.length > 0 && (
        <div className="pipeline-log" ref={logRef}>
          {logs.map((log, i) => (
            <div key={i} className={`log-line status-${log.status}`}>
              <span className="log-time">{log.time}</span>
              <span className="log-stage">[{log.stage}]</span>
              <span className="log-msg">{log.message}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
