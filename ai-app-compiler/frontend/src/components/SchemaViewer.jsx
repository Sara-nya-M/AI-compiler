function syntaxHighlight(json) {
  if (!json) return ''
  const str = typeof json === 'string' ? json : JSON.stringify(json, null, 2)
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
      (match) => {
        let cls = 'json-number'
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = 'json-key'
          } else {
            cls = 'json-string'
          }
        } else if (/true|false/.test(match)) {
          cls = 'json-boolean'
        } else if (/null/.test(match)) {
          cls = 'json-null'
        }
        return `<span class="${cls}">${match}</span>`
      }
    )
}

export default function SchemaViewer({ data }) {
  if (!data) {
    return (
      <div className="empty-state">
        <div className="empty-subtitle">No schema data available yet</div>
      </div>
    )
  }

  const jsonString = JSON.stringify(data, null, 2)
  const byteSize = new Blob([jsonString]).size
  const highlighted = syntaxHighlight(data)

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString).catch(() => {})
  }

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'app-config.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '0.5rem', gap: 8 }}>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {byteSize.toLocaleString()} bytes
        </span>
        <button className="btn btn-ghost btn-sm" onClick={handleCopy}>
          📋 Copy
        </button>
        <button className="btn btn-ghost btn-sm" onClick={handleDownload}>
          ⬇️ Download
        </button>
      </div>
      <pre
        className="json-viewer"
        dangerouslySetInnerHTML={{ __html: highlighted }}
      />
    </div>
  )
}
